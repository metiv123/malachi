import { id, loadDb, mutateDb, nowIso } from './store.js';
import { extractWhatsAppButtonEvents, extractWhatsAppStatusEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapMetaDeliveryStatus, mapTextToIntent } from './metaWebhook.js';
import { handleElderResponse, optOutByPhone, setContactOptIn, setOptIn } from './malachi.js';

export async function processWhatsAppWebhookPayload(payload) {
  const buttons = extractWhatsAppButtonEvents(payload);
  const texts = extractWhatsAppTextEvents(payload);
  const statuses = extractWhatsAppStatusEvents(payload);
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
  const findOwnerFamilyByPhone = (from) => {
    const normalizedFrom = String(from).replace(/[^0-9]/g, '');
    const candidates = db.families.filter((family) => {
      const normalizedPhone = String(family.ownerPhone || '').replace(/[^0-9]/g, '');
      return normalizedPhone && (normalizedPhone.endsWith(normalizedFrom) || normalizedFrom.endsWith(normalizedPhone));
    });
    return candidates[candidates.length - 1] || null;
  };
  const approveOwnerContacts = async (from, approved) => {
    const family = findOwnerFamilyByPhone(from);
    if (!family) return null;
    const elderIds = db.elders.filter((elder) => elder.familyId === family.id).map((elder) => elder.id);
    const ownerPhone = String(family.ownerPhone || '').replace(/[^0-9]/g, '');
    const matchingContacts = db.contacts.filter((contact) => {
      const contactPhone = String(contact.whatsappPhone || '').replace(/[^0-9]/g, '');
      return elderIds.includes(contact.elderId) && contactPhone && (contactPhone.endsWith(ownerPhone) || ownerPhone.endsWith(contactPhone));
    });
    if (!matchingContacts.length) return { family, updated: 0 };
    for (const contact of matchingContacts) await setContactOptIn(contact.id, approved);
    return { family, updated: matchingContacts.length };
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
      if (fallbackContact) handled.push({ event: button, mapped, status: 'contact_opt_in_approved', contact: await setContactOptIn(fallbackContact.id, true) });
      else {
        const ownerResult = await approveOwnerContacts(button.from, true);
        handled.push(ownerResult ? { event: button, mapped, status: 'owner_opt_in_approved', result: ownerResult } : { event: button, mapped, status: 'ignored' });
      }
    }
    else if (mapped === 'decline_optin' && elder) handled.push({ event: button, mapped, status: 'opt_in_declined', elder: await setOptIn(elder.id, false) });
    else if (mapped === 'decline_optin') {
      const fallbackContact = findContactByPhone(button.from);
      if (fallbackContact) handled.push({ event: button, mapped, status: 'contact_opt_in_declined', contact: await setContactOptIn(fallbackContact.id, false) });
      else {
        const ownerResult = await approveOwnerContacts(button.from, false);
        handled.push(ownerResult ? { event: button, mapped, status: 'owner_opt_in_declined', result: ownerResult } : { event: button, mapped, status: 'ignored' });
      }
    }
    else {
      const check = await handleElderResponse({ elderId: elder.id, response: mapped });
      handled.push({ event: button, mapped, status: check?.action === 'ignored_no_open_check' ? 'ignored_no_open_check' : 'response_recorded', check });
    }
  }

  for (const textEvent of texts) {
    const mapped = mapTextToIntent(textEvent);
    const elder = findElder(textEvent.from);
    if (!mapped || !elder) handled.push({ event: textEvent, mapped, status: 'ignored' });
    else if (mapped === 'opt_out') handled.push({ event: textEvent, mapped, status: 'opted_out', result: await optOutByPhone(textEvent.from) });
    else {
      const check = await handleElderResponse({ elderId: elder.id, response: mapped });
      handled.push({ event: textEvent, mapped, status: check?.action === 'ignored_no_open_check' ? 'ignored_no_open_check' : 'response_recorded', check });
    }
  }

  const statusUpdates = [];
  for (const statusEvent of statuses) {
    const mappedStatus = mapMetaDeliveryStatus(statusEvent.status);
    if (!mappedStatus || !statusEvent.messageId) {
      statusUpdates.push({ event: statusEvent, status: 'ignored' });
      continue;
    }
    statusUpdates.push({ event: statusEvent, status: 'delivery_status_updated', mappedStatus });
  }

  await mutateDb((currentDb) => {
    currentDb.outboundMessages = currentDb.outboundMessages || [];
    for (const item of statusUpdates) {
      if (item.status !== 'delivery_status_updated') continue;
      const event = item.event || {};
      const message = currentDb.outboundMessages.find((m) => m.meta?.whatsappMessageId === event.messageId);
      if (!message) continue;
      message.status = item.mappedStatus;
      message.providerStatusAt = event.timestamp ? new Date(Number(event.timestamp) * 1000).toISOString() : nowIso();
      message.providerRecipientId = event.recipientId || message.providerRecipientId || '';
      if (event.conversationId) message.providerConversationId = event.conversationId;
      if (event.pricingCategory) message.providerPricingCategory = event.pricingCategory;
      if (event.error) message.error = event.error;
    }
    currentDb.inboundMessages = currentDb.inboundMessages || [];
    for (const item of handled) {
      const event = item.event || {};
      currentDb.inboundMessages.push({
        id: id('in'),
        type: event.type || 'unknown',
        from: String(event.from || '').replace(/[^0-9]/g, ''),
        fromLast4: String(event.from || '').replace(/[^0-9]/g, '').slice(-4),
        messageId: event.messageId || null,
        timestamp: event.timestamp || null,
        text: event.type === 'text' ? String(event.text || '') : '',
        buttonId: event.type === 'button' ? String(event.buttonId || '') : '',
        buttonTitle: event.type === 'button' ? String(event.buttonTitle || '') : '',
        mapped: item.mapped || null,
        status: item.status || 'unknown',
        createdAt: nowIso()
      });
    }
    currentDb.audit.push({
      id: id('evt'),
      type: 'whatsapp_webhook_received',
      payload: {
        buttonEvents: buttons.length,
        textEvents: texts.length,
        statusEvents: statuses.length,
        handled: handled.map((item) => ({
          status: item.status,
          mapped: item.mapped || null,
          fromLast4: String(item.event?.from || '').replace(/[^0-9]/g, '').slice(-4),
          matched: Boolean(item.elder || item.contact || item.result?.family),
          updated: item.result?.updated ?? null
        })),
        statusUpdates: statusUpdates.map((item) => ({
          status: item.status,
          mappedStatus: item.mappedStatus || null,
          messageId: item.event?.messageId || null,
          recipientLast4: String(item.event?.recipientId || '').replace(/[^0-9]/g, '').slice(-4)
        }))
      },
      createdAt: nowIso()
    });
  });

  return handled;
}
