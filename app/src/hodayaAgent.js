import { config } from './config.js';
import { id, loadDb, mutateDb, nowIso } from './store.js';
import { sendHodayaWindowOpenTemplate, sendMetaText } from './whatsapp.js';

function normalizeDigits(phone = '') {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function samePhone(a = '', b = '') {
  const x = normalizeDigits(a);
  const y = normalizeDigits(b);
  return Boolean(x && y && (x.endsWith(y) || y.endsWith(x)));
}

function maskPhone(phone = '') {
  const digits = normalizeDigits(phone);
  if (!digits) return '';
  return `${digits.slice(0, 4)}***${digits.slice(-4)}`;
}

function configuredPhone() {
  return normalizeDigits(config.hodayaAgent?.phone || '');
}

export function isHodayaAgentEnabled() {
  return Boolean(config.hodayaAgent?.enabled && configuredPhone());
}

export function isHodayaAgentSender(phone = '') {
  return isHodayaAgentEnabled() && samePhone(phone, configuredPhone());
}

function inboundBody(event = {}) {
  if (event.type === 'text') return String(event.text || '').trim();
  if (event.type === 'button') return String(event.buttonTitle || event.buttonId || '').trim();
  return '';
}

function isWindowOpeningEvent(event = {}) {
  const body = inboundBody(event);
  const buttonId = String(event.buttonId || '').trim();
  return event.type === 'text' || buttonId === 'daily_ok' || buttonId === 'hodaya_open' || body === 'אני בסדר' || body === 'פתחי שיחה' || body === 'פתיחת שיחה';
}

export async function processHodayaAgentEvents(events = []) {
  const hodayaEvents = events.filter((event) => isHodayaAgentSender(event.from));
  if (!hodayaEvents.length) return [];

  const handled = hodayaEvents.map((event) => ({
    event,
    mapped: isWindowOpeningEvent(event) ? 'hodaya_window_opened' : 'hodaya_message_received',
    status: isWindowOpeningEvent(event) ? 'hodaya_agent_window_opened' : 'hodaya_agent_message_received',
    isolatedAgent: 'hodaya'
  }));

  await mutateDb((db) => {
    db.hodayaAgent = db.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
    db.hodayaAgent.inboundMessages = db.hodayaAgent.inboundMessages || [];
    db.hodayaAgent.state = db.hodayaAgent.state || {};
    db.audit = db.audit || [];

    for (const item of handled) {
      const event = item.event || {};
      const createdAt = nowIso();
      db.hodayaAgent.inboundMessages.push({
        id: id('hodaya_in'),
        type: event.type || 'unknown',
        from: normalizeDigits(event.from),
        fromLast4: normalizeDigits(event.from).slice(-4),
        messageId: event.messageId || null,
        timestamp: event.timestamp || null,
        text: event.type === 'text' ? String(event.text || '') : '',
        buttonId: event.type === 'button' ? String(event.buttonId || '') : '',
        buttonTitle: event.type === 'button' ? String(event.buttonTitle || '') : '',
        mapped: item.mapped,
        status: item.status,
        createdAt
      });
      db.hodayaAgent.state.lastInboundAt = createdAt;
      db.hodayaAgent.state.serviceWindowUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.hodayaAgent.state.phoneLast4 = normalizeDigits(event.from).slice(-4);
    }

    db.audit.push({
      id: id('evt'),
      type: 'hodaya_agent_webhook_routed',
      payload: {
        count: handled.length,
        fromLast4: normalizeDigits(handled[0]?.event?.from || '').slice(-4),
        statuses: handled.map((item) => item.status)
      },
      createdAt: nowIso()
    });
  });

  return handled;
}

function serviceWindowIsOpen(state = {}) {
  return state.serviceWindowUntil ? new Date(state.serviceWindowUntil).getTime() > Date.now() : false;
}

export async function getHodayaAgentStatus() {
  const db = await loadDb();
  const state = db.hodayaAgent?.state || {};
  const serviceWindowUntil = state.serviceWindowUntil || null;
  const in24hWindow = serviceWindowIsOpen(state);
  return {
    enabled: isHodayaAgentEnabled(),
    phoneConfigured: Boolean(configuredPhone()),
    phone: maskPhone(configuredPhone()),
    in24hWindow,
    serviceWindowUntil,
    inboundCount: db.hodayaAgent?.inboundMessages?.length || 0,
    outboundCount: db.hodayaAgent?.outboundMessages?.length || 0,
    taskCount: db.hodayaAgent?.tasks?.length || 0,
    lastInboundAt: state.lastInboundAt || null
  };
}

export async function listHodayaAgentMessages({ limit = 20 } = {}) {
  const db = await loadDb();
  const inbound = (db.hodayaAgent?.inboundMessages || []).slice().reverse().slice(0, Number(limit || 20));
  const outbound = (db.hodayaAgent?.outboundMessages || []).slice().reverse().slice(0, Number(limit || 20));
  return {
    status: await getHodayaAgentStatus(),
    inbound: inbound.map((message) => ({ ...message, from: maskPhone(message.from) })),
    outbound: outbound.map((message) => ({ ...message, to: maskPhone(message.to) }))
  };
}

export async function sendHodayaAgentReply({ message, dryRun = true } = {}) {
  if (!isHodayaAgentEnabled()) throw new Error('Hodaya agent is disabled or phone is not configured');
  const body = String(message || '').trim();
  if (!body) throw new Error('Missing reply message');
  const db = await loadDb();
  const state = db.hodayaAgent?.state || {};
  if (!serviceWindowIsOpen(state)) throw new Error('Hodaya is outside 24h WhatsApp service window');
  const to = configuredPhone();
  if (dryRun) return { dryRun: true, eligible: true, to: maskPhone(to), body };

  let providerResponse = null;
  if (config.whatsappProvider === 'meta') providerResponse = await sendMetaText(to, body);
  const outbound = {
    id: id('hodaya_out'),
    provider: config.whatsappProvider,
    kind: 'hodaya_agent_reply',
    to,
    body,
    status: 'sent',
    meta: { isolatedAgent: 'hodaya', whatsappMessageId: providerResponse?.messages?.[0]?.id || null },
    createdAt: nowIso()
  };
  await mutateDb((currentDb) => {
    currentDb.hodayaAgent = currentDb.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
    currentDb.hodayaAgent.outboundMessages = currentDb.hodayaAgent.outboundMessages || [];
    currentDb.hodayaAgent.outboundMessages.push(outbound);
    currentDb.audit = currentDb.audit || [];
    currentDb.audit.push({ id: id('evt'), type: 'hodaya_agent_reply_sent', payload: { to: maskPhone(to), messageId: outbound.id }, createdAt: nowIso() });
  });
  return { dryRun: false, sent: true, to: maskPhone(to), messageId: outbound.id, whatsappMessageId: outbound.meta.whatsappMessageId };
}

export async function prepareHodayaWindowOpenTemplate({ dryRun = true } = {}) {
  if (!isHodayaAgentEnabled()) throw new Error('Hodaya agent is disabled or phone is not configured');
  const to = configuredPhone();
  const templateName = config.hodayaAgent?.windowTemplate || config.meta.templates.dailyCheck;
  const name = config.hodayaAgent?.displayName || 'הודיה';

  if (dryRun) {
    return {
      dryRun: true,
      to: maskPhone(to),
      templateName,
      language: 'he',
      bodyParams: [name],
      buttonPayload: templateName === config.meta.templates.dailyCheck ? 'daily_ok' : 'hodaya_open',
      note: 'POC uses the existing approved daily_check template with the “אני בסדר” button only to open a 24h service window.'
    };
  }

  const outbound = await sendHodayaWindowOpenTemplate(to, { name, templateName });
  await mutateDb((db) => {
    db.hodayaAgent = db.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
    db.hodayaAgent.outboundMessages = db.hodayaAgent.outboundMessages || [];
    db.hodayaAgent.outboundMessages.push(outbound);
    db.audit = db.audit || [];
    db.audit.push({ id: id('evt'), type: 'hodaya_agent_window_template_sent', payload: { to: maskPhone(to), messageId: outbound.id, templateName }, createdAt: nowIso() });
  });
  return { dryRun: false, sent: true, to: maskPhone(to), templateName, messageId: outbound.id };
}
