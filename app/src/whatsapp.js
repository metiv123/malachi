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
    status: meta.status || 'sent',
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

export async function sendMetaText(to, text) {
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

export async function sendMetaTypingIndicator(messageId) {
  if (!messageId) return { skipped: true, reason: 'missing_message_id' };
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    throw new Error('Meta credentials missing: META_PHONE_NUMBER_ID / META_ACCESS_TOKEN');
  }

  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    typing_indicator: { type: 'text' }
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
    throw new Error(`Meta typing indicator failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendMetaReaction(to, messageId, emoji = '❤️') {
  if (!messageId) return { skipped: true, reason: 'missing_message_id' };
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    throw new Error('Meta credentials missing: META_PHONE_NUMBER_ID / META_ACCESS_TOKEN');
  }

  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'reaction',
    reaction: { message_id: messageId, emoji }
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
    throw new Error(`Meta reaction failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function sendMetaInteractiveButtons(to, text, buttons = []) {
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    throw new Error('Meta credentials missing: META_PHONE_NUMBER_ID / META_ACCESS_TOKEN');
  }

  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: buttons.slice(0, 3).map((button) => ({
          type: 'reply',
          reply: { id: button.id, title: button.title }
        }))
      }
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
    throw new Error(`Meta interactive send failed ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendOptIn(elder, family) {
  const body = `שלום ${elder.name} 🌿\nכאן מלאכי. ${family.ownerName} ביקש/ה לצרף אותך לבדיקת בוקר יומית ב-WhatsApp. בכל יום בשעה ${elder.dailyCheckTime} נשלח הודעה קצרה כדי לוודא שהכול בסדר.`;
  const buttons = [{ id: 'approve_optin', title: 'מאשר/ת' }, { id: 'decline_optin', title: 'לא מעוניין/ת' }];
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.optin, 'he', [
      ...bodyComponent([elder.name, family.ownerName, elder.dailyCheckTime]),
      quickReplyButton(0, 'approve_optin'),
      quickReplyButton(1, 'decline_optin')
    ]);
  }
  return recordOutbound('optin', elder.whatsappPhone, body, buttons, { elderId: elder.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendContactOptIn(contact, elder, family) {
  const body = `שלום ${contact.name} 🌿\nכאן מלאכי. ${family.ownerName} צירף/ה אותך כאיש קשר להתראות עבור ${elder.name}. אם ${elder.name} לא יענה/תענה לבדיקת הבוקר — נעדכן אותך ב־WhatsApp.`;
  const buttons = [{ id: `approve_contact_optin:${contact.id}`, title: 'מאשר/ת' }, { id: `decline_contact_optin:${contact.id}`, title: 'לא מעוניין/ת' }];
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    const usesElderOptInTemplate = config.meta.templates.contactOptin === config.meta.templates.optin;
    const params = usesElderOptInTemplate
      ? [contact.name, family.ownerName, elder.dailyCheckTime]
      : [contact.name, elder.name, family.ownerName];
    providerResponse = await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.contactOptin, 'he', [
      ...bodyComponent(params),
      quickReplyButton(0, `approve_contact_optin:${contact.id}`),
      quickReplyButton(1, `decline_contact_optin:${contact.id}`)
    ]);
  }
  return recordOutbound('contact_optin', contact.whatsappPhone, body, buttons, { elderId: elder.id, contactId: contact.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendDailyCheck(elder, check) {
  const singleOkMode = config.dailyCheckMode === 'single_ok';
  const freeformMode = config.dailyCheckMode === 'freeform_connection';
  const body = singleOkMode
    ? `בוקר טוב ${elder.name} 🌿\nכאן מלאכי. רק לסמן שהכול בסדר הבוקר.`
    : `בוקר טוב ${elder.name} 🌿\nכאן מלאכי, רק לוודא מה שלומך הבוקר.`;
  const buttons = singleOkMode
    ? [{ id: 'daily_ok', title: 'אני בסדר' }]
    : [{ id: 'daily_ok', title: 'הכול בסדר' }, { id: 'daily_greeting', title: 'שלח ד״ש למשפחה' }];
  let providerResponse = null;
  if (config.whatsappProvider === 'meta' && freeformMode) {
    providerResponse = await sendMetaInteractiveButtons(elder.whatsappPhone, body, buttons);
  } else if (config.whatsappProvider === 'meta') {
    const templateButtons = singleOkMode
      ? [quickReplyButton(0, 'daily_ok')]
      : [quickReplyButton(0, 'daily_ok'), quickReplyButton(1, 'daily_greeting')];
    providerResponse = await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.dailyCheck, 'he', [
      ...bodyComponent([elder.name]),
      ...templateButtons
    ]);
  }
  return recordOutbound('daily_check', elder.whatsappPhone, body, buttons, { elderId: elder.id, checkId: check.id, mode: config.dailyCheckMode, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendDailyReminder(elder, check) {
  const body = `היי ${elder.name} 🌿\nרק תזכורת קטנה ממלאכי — נשמח לדעת שהכול בסדר. אפשר ללחוץ על הכפתור למטה.`;
  const buttons = [{ id: 'daily_ok', title: 'אני בסדר' }];
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    // Until the dedicated reminder template is approved, use the existing daily-check template.
    // This keeps reminders compliant outside the 24h WhatsApp service window.
    providerResponse = await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.dailyReminder, 'he', [
      ...bodyComponent([elder.name]),
      quickReplyButton(0, 'daily_ok')
    ]);
  }
  return recordOutbound('daily_reminder', elder.whatsappPhone, body, buttons, { elderId: elder.id, checkId: check.id, reminderCount: Number(check.noResponseReminderCount || 0), templateName: config.meta.templates.dailyReminder, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendDistressAlert(contact, elder, check) {
  const time = new Date().toLocaleTimeString('he-IL', { timeZone: config.timezone || 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const body = `התראת מלאכי: ${elder.name} לחץ/ה על “מצוקה” בשעה ${time}. מומלץ ליצור קשר מיד.`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.distressAlert, 'he', bodyComponent([elder.name, time]));
  }
  return recordOutbound('distress_alert', contact.whatsappPhone, body, [], { elderId: elder.id, checkId: check?.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendNoResponseAlert(contact, elder, check) {
  const time = new Date().toLocaleTimeString('he-IL', { timeZone: config.timezone || 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const body = `מלאכי: ${elder.name} לא ענה/ענתה להודעת הבוקר עד עכשיו. כדאי ליצור קשר ולוודא שהכול בסדר.`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.noResponseAlert, 'he', bodyComponent([elder.name, time]));
  }
  return recordOutbound('no_response_alert', contact.whatsappPhone, body, [], { elderId: elder.id, checkId: check.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendFamilyGreeting(contact, elder, check) {
  const body = `הודעת מלאכי: ${elder.name} שולח/ת לך דרישת שלום ❤️`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaTemplate(contact.whatsappPhone, config.meta.templates.familyGreeting, 'he', bodyComponent([elder.name]));
  }
  return recordOutbound('family_greeting', contact.whatsappPhone, body, [], { elderId: elder.id, checkId: check?.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendOkAck(elder) {
  const body = `תודה ${elder.name} ❤️\nשמחנו לשמוע שהכול בסדר. נבדוק שוב מחר בבוקר.`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    if (!config.meta.templates.okAck) {
      return recordOutbound('ok_ack', elder.whatsappPhone, body, [], { elderId: elder.id, status: 'skipped', reason: 'META_TEMPLATE_OK_ACK not approved/configured' });
    }
    providerResponse = await sendMetaTemplate(elder.whatsappPhone, config.meta.templates.okAck, 'he', bodyComponent([elder.name]));
  }
  return recordOutbound('ok_ack', elder.whatsappPhone, body, [], { elderId: elder.id, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendOkReaction(elder, check, inboundMessageId, emoji = '❤️') {
  const body = `${emoji} reaction על הודעת “אני בסדר”`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaReaction(elder.whatsappPhone, inboundMessageId, emoji);
  }
  return recordOutbound('ok_reaction', elder.whatsappPhone, body, [], {
    elderId: elder.id,
    checkId: check?.id || null,
    inboundMessageId,
    emoji,
    whatsappMessageId: providerResponse?.messages?.[0]?.id || null
  });
}

export async function sendIncompleteSignupReminder(family, { signupUrl = '' } = {}) {
  const link = signupUrl || config.publicBaseUrl || 'https://malachi-v78v.onrender.com/';
  const body = `היי ${family.ownerName} 🌿\nראינו שהתחלת הרשמה למלאכי, אבל עדיין חסרים פרטים כדי להפעיל את השירות.\nכדי שנוכל לשלוח בדיקת בוקר ולאפשר למשפחה לקבל עדכון אם אין מענה, צריך להשלים את הפרטים כאן: ${link}\nאם זה לא רלוונטי, אפשר להתעלם מההודעה.`;
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    if (!config.meta.templates.incompleteSignupReminder) {
      return recordOutbound('incomplete_signup_reminder', family.ownerPhone, body, [], { familyId: family.id, status: 'skipped', reason: 'META_TEMPLATE_INCOMPLETE_SIGNUP_REMINDER not approved/configured' });
    }
    providerResponse = await sendMetaTemplate(family.ownerPhone, config.meta.templates.incompleteSignupReminder, 'he', bodyComponent([family.ownerName, link]));
  }
  return recordOutbound('incomplete_signup_reminder', family.ownerPhone, body, [], { familyId: family.id, templateName: config.meta.templates.incompleteSignupReminder, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendHodayaWindowOpenTemplate(to, { name = 'הודיה', templateName = '' } = {}) {
  const selectedTemplate = templateName || config.hodayaAgent?.windowTemplate || config.meta.templates.dailyCheck;
  const buttonPayload = selectedTemplate === config.meta.templates.dailyCheck ? 'daily_ok' : 'hodaya_open';
  const buttonTitle = selectedTemplate === config.meta.templates.dailyCheck ? 'אני בסדר' : 'פתחי שיחה';
  const body = `היי ${name} 🌿\nיש לי עדכון שביקשת לקבל. אפשר ללחוץ על הכפתור כדי לפתוח שיחה.`;
  const buttons = [{ id: buttonPayload, title: buttonTitle }];
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaTemplate(to, selectedTemplate, 'he', [
      ...bodyComponent([name]),
      quickReplyButton(0, buttonPayload)
    ]);
  }
  return recordOutbound('hodaya_window_open', to, body, buttons, { templateName: selectedTemplate, isolatedAgent: 'hodaya', whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendBetaUpdate(to, text, meta = {}) {
  const body = String(text || '').trim();
  if (!body) throw new Error('Missing beta update text');
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaText(to, body);
  }
  return recordOutbound('beta_update', to, body, [], { ...meta, whatsappMessageId: providerResponse?.messages?.[0]?.id || null });
}

export async function sendWebsiteLeadAutoReply(to, text, meta = {}) {
  const body = String(text || '').trim();
  if (!body) throw new Error('Missing website lead auto-reply text');
  let providerResponse = null;
  if (config.whatsappProvider === 'meta') {
    providerResponse = await sendMetaText(to, body);
  }
  return recordOutbound('website_lead_auto_reply', to, body, [], {
    ...meta,
    whatsappMessageId: providerResponse?.messages?.[0]?.id || null
  });
}
