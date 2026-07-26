import { config } from './config.js';
import { id, loadDb, mutateDb, nowIso } from './store.js';
import { sendHodayaWindowOpenTemplate, sendMetaText, sendMetaTypingIndicator } from './whatsapp.js';

let eventDrivenTimer = null;

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
  return buttonId === 'daily_ok' || buttonId === 'hodaya_open' || body === 'אני בסדר' || body === 'פתחי שיחה' || body === 'פתיחת שיחה';
}

function isActionableTextEvent(event = {}) {
  return event.type === 'text' && String(event.text || '').trim().length > 0;
}

function eventDrivenIsConfigured() {
  return Boolean(config.hodayaAgent?.eventDrivenEnabled && config.hodayaAgent?.eventHookUrl && config.hodayaAgent?.eventHookToken);
}

function newestActionableText(handled = []) {
  return handled
    .filter((item) => item?.isolatedAgent === 'hodaya' && item.status === 'hodaya_agent_message_received' && isActionableTextEvent(item.event))
    .slice(-1)[0] || null;
}

function sendTypingIndicatorsBestEffort(handled = []) {
  if (!config.hodayaAgent?.typingIndicatorEnabled) return;
  if (config.whatsappProvider !== 'meta') return;
  const actionable = handled.filter((item) => item?.isolatedAgent === 'hodaya' && item.status === 'hodaya_agent_message_received' && isActionableTextEvent(item.event));
  for (const item of actionable) {
    const messageId = item.event?.messageId;
    if (!messageId) continue;
    sendMetaTypingIndicator(messageId).catch((err) => {
      console.error('[hodaya-agent] typing indicator failed', err.message);
    });
  }
}

function buildEventDrivenPrompt() {
  return `Reply once as Shiri to Hodaya via the isolated Malachi Hodaya bridge.

Rules:
- Use only these live endpoints on https://malachi-v78v.onrender.com:
  GET /api/admin/hodaya-agent/status
  GET /api/admin/hodaya-agent/messages?limit=20
  POST /api/admin/hodaya-agent/reply
- Admin token is in /data/.openclaw/workspace/.secrets/malachi-admin-token. Never print it.
- If disabled or outside the 24h WhatsApp window, do not send; answer HEARTBEAT_OK.
- Reply only to the newest actionable Hodaya text without a later real hodaya_agent_reply or hodaya_agent_quick_reply.
- Ignore fast ACKs and window-opening buttons.
- Hebrew, warm, concise, like Shiri. Do not speak as Metiv.
- Send at most one POST /api/admin/hodaya-agent/reply with dryRun:false.`;
}

async function sendFastAckBestEffort(handled = []) {
  if (!config.hodayaAgent?.fastAckEnabled) return;
  if (config.whatsappProvider !== 'meta') return;
  const actionable = newestActionableText(handled);
  if (!actionable) return;
  try {
    const db = await loadDb();
    const state = db.hodayaAgent?.state || {};
    if (!serviceWindowIsOpen(state)) return;
    const lastAt = state.lastFastAckAt ? new Date(state.lastFastAckAt).getTime() : 0;
    const minGap = Math.max(0, Number(config.hodayaAgent?.fastAckMinGapMs || 15000));
    if (lastAt && Date.now() - lastAt < minGap) return;
    const to = configuredPhone();
    const body = 'קיבלתי, אני איתך 🌸';
    const providerResponse = await sendMetaText(to, body);
    const outbound = {
      id: id('hodaya_ack'),
      provider: config.whatsappProvider,
      kind: 'hodaya_agent_fast_ack',
      to,
      body,
      status: 'sent',
      meta: { isolatedAgent: 'hodaya', inboundMessageId: actionable.event?.messageId || null, whatsappMessageId: providerResponse?.messages?.[0]?.id || null },
      createdAt: nowIso()
    };
    await mutateDb((currentDb) => {
      currentDb.hodayaAgent = currentDb.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
      currentDb.hodayaAgent.outboundMessages = currentDb.hodayaAgent.outboundMessages || [];
      currentDb.hodayaAgent.state = currentDb.hodayaAgent.state || {};
      currentDb.hodayaAgent.outboundMessages.push(outbound);
      currentDb.hodayaAgent.state.lastFastAckAt = outbound.createdAt;
      currentDb.audit = currentDb.audit || [];
      currentDb.audit.push({ id: id('evt'), type: 'hodaya_agent_fast_ack_sent', payload: { to: maskPhone(to), messageId: outbound.id }, createdAt: nowIso() });
    });
  } catch (err) {
    console.error('[hodaya-agent] fast ack failed', err.message);
  }
}

function quickReplyForText(text = '') {
  const normalized = String(text || '').trim().replace(/[!?.…\s]+$/g, '');
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  const greetings = new Set(['היי', 'הי', 'הייי', 'שלום', 'אהלן', 'הלוו', 'hello', 'hi']);
  if (greetings.has(lower)) return 'היי הודיה 🌸 אני כאן. מה תרצי שאעזור לך לסדר עכשיו?';
  if (['בוקר טוב', 'צהריים טובים', 'ערב טוב', 'לילה טוב'].includes(lower)) return `${normalized} הודיה 🌸 אני כאן. מה תרצי שאעזור לך לסדר עכשיו?`;
  if (['מה נשמע', 'מה שלומך', 'מה קורה'].includes(lower)) return 'שלומי טוב, תודה ששאלת 🌸 אני כאן איתך. במה תרצי שאעזור?';
  if (['תודה', 'תודה רבה', 'תודה לך', 'מעולה', 'סבבה', 'אוקיי', 'אוקי'].includes(lower)) return 'בשמחה הודיה 🌸';
  return '';
}

async function sendQuickReplyBestEffort(handled = []) {
  if (config.whatsappProvider !== 'meta') return { sent: false, reason: 'provider_not_meta' };
  const actionable = newestActionableText(handled);
  if (!actionable) return { sent: false, reason: 'no_actionable_text' };
  const reply = quickReplyForText(actionable.event?.text || '');
  if (!reply) return { sent: false, reason: 'no_quick_reply_match' };
  try {
    const db = await loadDb();
    const state = db.hodayaAgent?.state || {};
    if (!serviceWindowIsOpen(state)) return { sent: false, reason: 'outside_24h_window' };
    const inboundMessageId = actionable.event?.messageId || null;
    const alreadyReplied = (db.hodayaAgent?.outboundMessages || []).some((message) =>
      message.kind === 'hodaya_agent_quick_reply' && message.meta?.inboundMessageId && message.meta.inboundMessageId === inboundMessageId
    );
    if (alreadyReplied) return { sent: false, reason: 'already_replied' };
    const to = configuredPhone();
    const providerResponse = await sendMetaText(to, reply);
    const outbound = {
      id: id('hodaya_quick'),
      provider: config.whatsappProvider,
      kind: 'hodaya_agent_quick_reply',
      to,
      body: reply,
      status: 'sent',
      meta: { isolatedAgent: 'hodaya', inboundMessageId, whatsappMessageId: providerResponse?.messages?.[0]?.id || null },
      createdAt: nowIso()
    };
    await mutateDb((currentDb) => {
      currentDb.hodayaAgent = currentDb.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
      currentDb.hodayaAgent.outboundMessages = currentDb.hodayaAgent.outboundMessages || [];
      currentDb.hodayaAgent.state = currentDb.hodayaAgent.state || {};
      currentDb.hodayaAgent.tasks = currentDb.hodayaAgent.tasks || [];
      currentDb.hodayaAgent.outboundMessages.push(outbound);
      currentDb.hodayaAgent.state.lastEventDrivenInboundId = actionable.id || null;
      currentDb.hodayaAgent.state.lastEventDrivenTriggeredAt = outbound.createdAt;
      currentDb.hodayaAgent.tasks.push({ id: id('hodaya_task'), kind: 'quick_reply', inboundId: actionable.id || null, status: 'sent', createdAt: outbound.createdAt });
      currentDb.audit = currentDb.audit || [];
      currentDb.audit.push({ id: id('evt'), type: 'hodaya_agent_quick_reply_sent', payload: { to: maskPhone(to), inboundId: actionable.id || null, messageId: outbound.id }, createdAt: nowIso() });
    });
    return { sent: true, inboundId: actionable.id || null };
  } catch (err) {
    console.error('[hodaya-agent] quick reply failed', err.message);
    return { sent: false, reason: 'failed', error: err.message };
  }
}

async function postEventDrivenHook() {
  const url = config.hodayaAgent?.eventHookUrl;
  const token = config.hodayaAgent?.eventHookToken;
  if (!url || !token) throw new Error('Hodaya event hook is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, Number(config.hodayaAgent?.eventHookTimeoutMs || 10000)));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Hodaya immediate WhatsApp reply',
        message: buildEventDrivenPrompt(),
        agentId: 'main',
        timeoutSeconds: 45,
        thinking: 'low',
        lightContext: true
      }),
      signal: controller.signal
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Hook returned ${res.status}: ${text.slice(0, 200)}`);
    return { ok: true, status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}

export async function triggerHodayaEventDrivenTurn({ reason = 'manual', dryRun = false } = {}) {
  const db = await loadDb();
  db.hodayaAgent = db.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
  const state = db.hodayaAgent.state || {};
  const newestInbound = (db.hodayaAgent.inboundMessages || []).slice().reverse().find((message) => message.type === 'text' && String(message.text || '').trim());
  if (!newestInbound) return { triggered: false, reason: 'no_actionable_text' };
  if (!serviceWindowIsOpen(state)) return { triggered: false, reason: 'outside_24h_window' };
  if (!config.hodayaAgent?.eventDrivenEnabled) return { triggered: false, reason: 'disabled' };
  if (!config.hodayaAgent?.eventHookUrl || !config.hodayaAgent?.eventHookToken) return { triggered: false, reason: 'missing_hook_config' };
  if (state.lastEventDrivenInboundId === newestInbound.id) return { triggered: false, reason: 'already_triggered_for_latest', inboundId: newestInbound.id };
  const lastAt = state.lastEventDrivenTriggeredAt ? new Date(state.lastEventDrivenTriggeredAt).getTime() : 0;
  const minGap = Math.max(0, Number(config.hodayaAgent?.eventRateLimitMs || 15000));
  if (lastAt && Date.now() - lastAt < minGap) return { triggered: false, reason: 'rate_limited', inboundId: newestInbound.id };
  if (dryRun) return { triggered: true, dryRun: true, inboundId: newestInbound.id, reason };

  const hookResult = await postEventDrivenHook();
  await mutateDb((currentDb) => {
    currentDb.hodayaAgent = currentDb.hodayaAgent || { inboundMessages: [], outboundMessages: [], tasks: [], state: {} };
    currentDb.hodayaAgent.state = currentDb.hodayaAgent.state || {};
    currentDb.hodayaAgent.tasks = currentDb.hodayaAgent.tasks || [];
    currentDb.hodayaAgent.state.lastEventDrivenInboundId = newestInbound.id;
    currentDb.hodayaAgent.state.lastEventDrivenTriggeredAt = nowIso();
    currentDb.hodayaAgent.tasks.push({ id: id('hodaya_task'), kind: 'event_driven_reply', inboundId: newestInbound.id, status: 'triggered', reason, createdAt: nowIso() });
    currentDb.audit = currentDb.audit || [];
    currentDb.audit.push({ id: id('evt'), type: 'hodaya_agent_event_driven_triggered', payload: { inboundId: newestInbound.id, reason, hookStatus: hookResult.status }, createdAt: nowIso() });
  });
  return { triggered: true, inboundId: newestInbound.id, hookStatus: hookResult.status };
}

export function scheduleHodayaEventDrivenTurn(handled = []) {
  const actionable = newestActionableText(handled);
  if (!actionable) return { scheduled: false, reason: 'no_actionable_text' };
  if (!config.hodayaAgent?.eventDrivenEnabled) return { scheduled: false, reason: 'disabled' };
  if (!eventDrivenIsConfigured()) return { scheduled: false, reason: 'missing_hook_config' };
  if (eventDrivenTimer) clearTimeout(eventDrivenTimer);
  const delayMs = Math.max(0, Number(config.hodayaAgent?.eventDebounceMs || 10000));
  eventDrivenTimer = setTimeout(() => {
    triggerHodayaEventDrivenTurn({ reason: 'meta_webhook_debounced' }).catch((err) => {
      console.error('[hodaya-agent] event-driven trigger failed', err.message);
    });
  }, delayMs);
  return { scheduled: true, delayMs, inboundMessageId: actionable.event?.messageId || null };
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

  sendTypingIndicatorsBestEffort(handled);
  sendQuickReplyBestEffort(handled).then((result) => {
    if (result?.sent) return;
    scheduleHodayaEventDrivenTurn(handled);
    sendFastAckBestEffort(handled);
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
    lastInboundAt: state.lastInboundAt || null,
    eventDriven: {
      enabled: Boolean(config.hodayaAgent?.eventDrivenEnabled),
      hookConfigured: Boolean(config.hodayaAgent?.eventHookUrl && config.hodayaAgent?.eventHookToken),
      debounceMs: Number(config.hodayaAgent?.eventDebounceMs || 1500),
      rateLimitMs: Number(config.hodayaAgent?.eventRateLimitMs || 15000),
      typingIndicatorEnabled: Boolean(config.hodayaAgent?.typingIndicatorEnabled),
      fastAckEnabled: Boolean(config.hodayaAgent?.fastAckEnabled),
      fastAckMinGapMs: Number(config.hodayaAgent?.fastAckMinGapMs || 15000),
      lastTriggeredAt: state.lastEventDrivenTriggeredAt || null,
      lastInboundId: state.lastEventDrivenInboundId || null
    }
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
