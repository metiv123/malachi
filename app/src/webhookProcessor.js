import { id, loadDb, mutateDb, nowIso } from './store.js';
import { extractWhatsAppButtonEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapTextToIntent } from './metaWebhook.js';
import { handleElderResponse, optOutByPhone, setOptIn } from './malachi.js';

export async function processWhatsAppWebhookPayload(payload) {
  const buttons = extractWhatsAppButtonEvents(payload);
  const texts = extractWhatsAppTextEvents(payload);
  const handled = [];
  const db = await loadDb();
  const findElder = (from) => db.elders.find((e) => {
    const a = String(e.whatsappPhone).replace(/[^0-9]/g, '');
    const b = String(from).replace(/[^0-9]/g, '');
    return a.endsWith(b) || b.endsWith(a);
  });

  for (const button of buttons) {
    const mapped = mapButtonToResponse(button);
    const elder = findElder(button.from);
    if (!mapped || !elder) handled.push({ event: button, mapped, status: 'ignored' });
    else if (mapped === 'approve_optin') handled.push({ event: button, mapped, status: 'opt_in_approved', elder: await setOptIn(elder.id, true) });
    else if (mapped === 'decline_optin') handled.push({ event: button, mapped, status: 'opt_in_declined', elder: await setOptIn(elder.id, false) });
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
