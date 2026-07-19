export function extractWhatsAppButtonEvents(payload) {
  const events = [];
  const entries = payload?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        const interactive = message.interactive;
        const buttonReply = interactive?.button_reply;
        const templateButton = message.type === 'button' ? message.button : null;
        if (!buttonReply && !templateButton) continue;
        events.push({
          type: 'button',
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          buttonId: buttonReply?.id || templateButton?.payload || '',
          buttonTitle: buttonReply?.title || templateButton?.text || ''
        });
      }
    }
  }
  return events;
}

export function extractWhatsAppTextEvents(payload) {
  const events = [];
  const entries = payload?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        if (message.type !== 'text') continue;
        events.push({
          type: 'text',
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp,
          text: message.text?.body || ''
        });
      }
    }
  }
  return events;
}

export function mapButtonToResponse(button) {
  const id = String(button.buttonId || '').toLowerCase();
  const title = String(button.buttonTitle || '').trim();
  if (id.includes('ok') || title === 'הכול בסדר' || title === 'אני בסדר' || title === 'בסדר') return 'ok';
  if (id.includes('greeting') || id.includes('hello') || title.includes('ד״ש') || title.includes('דש') || title.includes('דרישת שלום') || title.includes('שלום למשפחה')) return 'greeting';
  if (id.includes('distress') || title === 'מצוקה') return 'distress';
  if (id.includes('approve_contact_optin')) return 'approve_contact_optin';
  if (id.includes('decline_contact_optin')) return 'decline_contact_optin';
  if (id.includes('approve') || title === 'מאשר/ת') return 'approve_optin';
  if (id.includes('decline') || title === 'לא מעוניין/ת') return 'decline_optin';
  return null;
}

export function mapTextToIntent(textEvent) {
  const text = String(textEvent.text || '').trim().toLowerCase();
  if (['הסרה', 'עצור', 'stop', 'unsubscribe', 'בטל', 'ביטול'].includes(text)) return 'opt_out';
  if (['בסדר', 'אני בסדר', 'הכל בסדר', 'הכול בסדר', 'ok'].includes(text)) return 'ok';
  if (['דש', 'ד״ש', 'דרישת שלום', 'שלח דש', 'שלח ד״ש', 'שלום למשפחה'].includes(text)) return 'greeting';
  if (['מצוקה', 'עזרה', 'help', 'sos'].includes(text)) return 'distress';
  return null;
}
