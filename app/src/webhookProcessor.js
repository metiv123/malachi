import { id, loadDb, mutateDb, nowIso } from './store.js';
import { extractWhatsAppButtonEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapTextToIntent } from './metaWebhook.js';
import { handleElderResponse, optOutByPhone, setContactOptIn, setOptIn } from './malachi.js';

export async function processWhatsAppWebhookPayload(payload) {
  const buttons = extractWhatsAppButtonEvents(payload);
  const texts = extractWhatsAppTextEvents(payload);
  const handled = [];
  const db = await loadDb();
  const findElder = (from) => {
    const normalizedFrom = String(from).replace(/[^0-9]/g, '');
    const candidates = db.elders.filter((elder) => {
      const normalizedPhone = String(elder.whatsappPhone).replace(/[^0-9]/g, '');
      return normalizedPhone.endsWith(normalizedFrom) || normalizedFrom.endsWith(normalizedPhone);
    });
    if (candidates.length <= 1) return candidates[0] || null;

    const latestOpen = candidates
      .map((elder) => ({
        elder,
        check: db.checks
          .filter((check) => check.elderId === elder.id && check.status === 'sent')
          .sort((a, b) => String(b.sentAt || b.scheduledAt).localeCompare(String(a.sentAt || a.scheduledAt)))[0] || null
      }))
      .filter((item) => item.check)
      .sort((a, b) => String(b.check.sentAt || b.check.scheduledAt).localeCompare(String(a.check.sentAt || a.check.scheduledAt)))[0];

    return latestOpen?.elder || candidates[candidates.length - 1];
  };
  const findContactByPhone = (from) => {
    const normalizedFrom = String(from).replace(/[^0-9]/g, '');
    const candidates = db.contacts.filter((contact) => {
      const normalizedPhone = String(contact.whatsappPhone).replace(/[^0-9]/g, '');
      return normalizedPhone.endsWith(normalizedFrom) || normalizedFrom.endsWith(normalizedPhone);
    });
    return candidates[candidates.length - 1] || null;
  };
  const findContact = (button, from) => {
    const explicitId = String(button?.buttonId || '').split(':')[1];
    if (explicitId) return db.contacts.find((contact) => contact.id === explicitId) || null;
    return findContactByPhone(from);
  };

  for (const button of buttons) {
    const mapped = mapButtonToResponse(button);
    const elder = findElder(button.from);
    const contact = mapped?.includes('contact_optin') ? findContact(button, button.from) : findContactByPhone(button.from);
    const hasTarget = mapped?.includes('contact_optin') ? Boolean(contact) : Boolean(elder || ((mapped === 'approve_optin' || mapped === 'decline_optin') && contact));
    if (!mapped || !hasTarget) handled.push({ event: button, mapped, status: 'ignored' });
    else if (mapped === 'approve_contact_optin') handled.push({ event: button, mapped, status: 'contact_opt_in_approved', contact: await setContactOptIn(contact.id, true) });
    else if (mapped === 'decline_contact_optin') handled.push({ event: button, mapped, status: 'contact_opt_in_declined', contact: await setContactOptIn(contact.id, false) });
    else if (mapped === 'approve_optin' && elder) handled.push({ event: button, mapped, status: 'opt_in_approved', elder: await setOptIn(elder.id, true) });
    else if (mapped === 'approve_optin') {
      const fallbackContact = findContactByPhone(button.from);
      handled.push(fallbackContact ? { event: button, mapped, status: 'contact_opt_in_approved', contact: await setContactOptIn(fallbackContact.id, true) } : { event: button, mapped, status: 'ignored' });
    }
    else if (mapped === 'decline_optin' && elder) handled.push({ event: button, mapped, status: 'opt_in_declined', elder: await setOptIn(elder.id, false) });
    else if (mapped === 'decline_optin') {
      const fallbackContact = findContactByPhone(button.from);
      handled.push(fallbackContact ? { event: button, mapped, status: 'contact_opt_in_declined', contact: await setContactOptIn(fallbackContact.id, false) } : { event: button, mapped, status: 'ignored' });
    }
    else handled.push({ event: button, mapped, status: 'response_recorded', check: await handleElderResponse({ elderId: elder.id, response: mapped }) });
  }

  for (const textEvent of texts) {
    const mapped = mapTextToIntent(textEvent);
    const elder = findElder(textEvent.from);
    if (!mapped || !elder) handled.push({ event: textEvent, mapped, status: 'ignored' });
    else if (mapped === 'opt_out') handled.push({ event: textEvent, mapped, status: 'opted_out', result: await optOutByPhone(textEvent.from) });
    else handled.push({ event: textEvent, mapped, status: 'response_recorded', check: await handleElderResponse({ elderId: elder.id, response: mapped }) });
  }

  await mutateDb((currentDb) => {
    currentDb.audit.push({
      id: id('evt'),
      type: 'whatsapp_webhook_received',
      payload: {
        buttonEvents: buttons.length,
        textEvents: texts.length,
        handled: handled.map((item) => ({
          status: item.status,
          mapped: item.mapped || null,
          fromLast4: String(item.event?.from || '').replace(/[^0-9]/g, '').slice(-4)
        }))
      },
      createdAt: nowIso()
    });
  });

  return handled;
}
