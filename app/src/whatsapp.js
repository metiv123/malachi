import { config } from './config.js';
import { id, mutateDb, nowIso } from './store.js';

function normalizePhone(phone = '') {
  return String(phone).replace(/[^0-9+]/g, '');
}

function textParam(text) {
  return { type: 'text', text: String(text ?? '') };
}

function bodyComponent(values = []) {
  return values.length ? [{ type: 'body', parameters: values.map(textParam) }] : [];
}

function quickReplyButton(index, payload) {
  return { type: 'button', sub_type: 'quick_reply', index: String(index), parameters: [{ type: 'payload', payload }] };
}

async function recordOutbound(kind, to, body, buttons = [], meta = {}) {
  const message = {
    id: id('msg'),
    provider: config.whatsappProvider,
    kind,
    to: normalizePhone(to),
    body,
    buttons,
    meta,
    createdAt: nowIso()
  };
  await mutateDb((db) => db.outboundMessages.push(message));
  return message;
}

async function sendMetaTemplate(to, templateName, languageCode = 'he', components = []) {
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    throw new Error('Meta credentials missing: META_PHONE_NUMBER_ID / META_ACCESS_TOKEN');
  }

  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Meta send failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function sendMetaText(to, text) {
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    throw new Error('Meta credentials missing: META_PHONE_NUMBER_ID / META_ACCESS_TOKEN');
  }

  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'text',
    text: { preview_url: false, body: text }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Meta text send failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendOptIn(elder, family) {
  const body = `שלום ${elder.name} 🌿\nכאן מלאכי. ${family.ownerName} ביקש/ה לצרף אותך לבדיקת בוקר יומית ב-WhatsApp. בכל יום בשעה ${elder.dailyCheckTime} נשלח הודעה קצרה כדי לוודא שהכול בסדר.`;
  const buttons = [{ id: 'approve_optin', title: 'מאשר/ת' }, { id: 'decline_optin', title: 'לא מעוניין/ת' }];
  if (config.whatsappProvider === 'meta') {
    await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.optin, 'he', [
      ...bodyComponent([elder.name, family.ownerName, elder.dailyCheckTime]),
      quickReplyButton(0, 'approve_optin'),
      quickReplyButton(1, 'decline_optin')
    ]);
  }
  return recordOutbound('optin', elder.whatsappPhone, body, buttons, { elderId: elder.id });
}

export async function sendDailyCheck(elder, check) {
  const body = `בוקר טוב ${elder.name} 🌿\nכאן מלאכי, רק לוודא שהכול בסדר הבוקר.`;
  const buttons = [{ id: 'daily_ok', title: 'הכול בסדר' }, { id: 'daily_distress', title: 'מצוקה' }];
  if (config.whatsappProvider === 'meta') {
    await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.dailyCheck, 'he', [
      ...bodyComponent([elder.name]),
      quickReplyButton(0, 'daily_ok'),
      quickReplyButton(1, 'daily_distress')
    ]);
  }
  return recordOutbound('daily_check', elder.whatsappPhone, body, buttons, { elderId: elder.id, checkId: check.id });
}

export async function sendDistressAlert(contact, elder, check) {
  const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const body = `התראת מלאכי: ${elder.name} לחץ/ה על “מצוקה” בשעה ${time}. מומלץ ליצור קשר מיד.`;
  if (config.whatsappProvider === 'meta') {
    await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.distressAlert, 'he', bodyComponent([elder.name, time]));
  }
  return recordOutbound('distress_alert', contact.whatsappPhone, body, [], { elderId: elder.id, checkId: check?.id });
}

export async function sendNoResponseAlert(contact, elder, check) {
  const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const body = `התראת מלאכי: ${elder.name} לא ענה/ענתה לבדיקת הבוקר עד עכשיו. מומלץ ליצור קשר ולוודא שהכול בסדר.`;
  if (config.whatsappProvider === 'meta') {
    await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.noResponseAlert, 'he', bodyComponent([elder.name, time]));
  }
  return recordOutbound('no_response_alert', contact.whatsappPhone, body, [], { elderId: elder.id, checkId: check.id });
}

export async function sendOkAck(elder) {
  const body = `תודה ${elder.name} ❤️\nשמחנו לשמוע שהכול בסדר. נבדוק שוב מחר בבוקר.`;
  if (config.whatsappProvider === 'meta') {
    await sendMetaText(elder.whatsappPhone, body);
  }
  return recordOutbound('ok_ack', elder.whatsappPhone, body, [], { elderId: elder.id });
}
