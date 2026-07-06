import { rm } from 'node:fs/promises';
import path from 'node:path';
import { createFamily, deleteFamilyByToken, exportFamiliesCsv, getCheckHistoryByToken, getFamilyByToken, getOutboundMessagesByToken, handleElderResponse, listDashboard, optOutByPhone, processDueChecks, processNoResponses, sendCheckNow, setElderActiveByToken, setOptIn, systemReadiness, updateElderByToken } from './malachi.js';
import { extractWhatsAppButtonEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapTextToIntent } from './metaWebhook.js';
import { loadDb } from './store.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function reset() {
  await rm(path.resolve(process.cwd(), 'data/db.json'), { force: true });
}

async function run() {
  await reset();
  const created = await createFamily({
    ownerName: 'שלמה',
    ownerPhone: '+972501111111',
    elderName: 'רחל',
    elderPhone: '+972502222222',
    dailyCheckTime: '09:00',
    contactName: 'שלמה',
    contactPhone: '+972501111111',
    consent: 'on'
  });
  assert(created.family.id, 'family id missing');
  assert(created.family.managementToken, 'management token missing');
  const privateFamily = await getFamilyByToken(created.family.managementToken);
  assert(privateFamily.elders.length === 1, 'private dashboard should show elder');
  await setElderActiveByToken(created.family.managementToken, created.elder.id, false);
  let pausedFamily = await getFamilyByToken(created.family.managementToken);
  assert(pausedFamily.elders[0].active === false, 'elder should be paused');
  await setElderActiveByToken(created.family.managementToken, created.elder.id, true);
  await updateElderByToken(created.family.managementToken, created.elder.id, { dailyCheckTime: '10:30', contactName: 'דוד' });
  let updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].dailyCheckTime === '10:30', 'elder time should update');
  assert(updatedFamily.elders[0].contact.name === 'דוד', 'contact should update');
  assert(created.elder.optInStatus === 'pending', 'opt-in should start pending');

  await setOptIn(created.elder.id, true);
  await updateElderByToken(created.family.managementToken, created.elder.id, { dailyCheckTime: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) });
  const scheduled = await processDueChecks(new Date());
  assert(scheduled.length === 1, 'scheduled due check should send once');
  const scheduledAgain = await processDueChecks(new Date());
  assert(scheduledAgain.length === 0, 'scheduled due check should not duplicate');

  const check = await sendCheckNow(created.elder.id);
  assert(check.status === 'sent', 'check should be sent');

  await handleElderResponse({ elderId: created.elder.id, checkId: check.id, response: 'ok' });
  let db = await loadDb();
  assert(db.checks.find((c) => c.id === check.id).status === 'ok', 'check should become ok');
  assert(db.outboundMessages.some((m) => m.kind === 'ok_ack'), 'ok ack missing');

  const check2 = await sendCheckNow(created.elder.id);
  await handleElderResponse({ elderId: created.elder.id, checkId: check2.id, response: 'distress' });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === check2.id).status === 'distress', 'check should become distress');
  assert(db.outboundMessages.some((m) => m.kind === 'distress_alert'), 'distress alert missing');

  const check3 = await sendCheckNow(created.elder.id);
  await processNoResponses({ graceMinutes: 0 });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === check3.id).status === 'no_response', 'check should become no_response');
  assert(db.outboundMessages.some((m) => m.kind === 'no_response_alert'), 'no response alert missing');

  const webhookPayload = { entry: [{ changes: [{ value: { messages: [{ from: '972502222222', id: 'wamid.test', timestamp: '1', interactive: { button_reply: { id: 'daily_ok', title: 'הכול בסדר' } } }] } }] }] };
  const buttons = extractWhatsAppButtonEvents(webhookPayload);
  assert(buttons.length === 1, 'webhook button extraction failed');
  assert(mapButtonToResponse(buttons[0]) === 'ok', 'webhook button mapping failed');

  const history = await getCheckHistoryByToken(created.family.managementToken, created.elder.id);
  assert(history.length >= 3, 'history should include checks');
  const outbound = await getOutboundMessagesByToken(created.family.managementToken, created.elder.id);
  assert(outbound.length >= 3, 'outbound message log should include messages');
  const readiness = await systemReadiness();
  assert(readiness.counts.families === 1, 'readiness should count family');

  const textPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '972502222222', id: 'wamid.text', timestamp: '1', text: { body: 'הסרה' } }] } }] }] };
  const texts = extractWhatsAppTextEvents(textPayload);
  assert(texts.length === 1, 'text extraction failed');
  assert(mapTextToIntent(texts[0]) === 'opt_out', 'opt-out text mapping failed');
  const optOut = await optOutByPhone('972502222222');
  assert(optOut.found === true, 'opt out should find elder');

  const csv = await exportFamiliesCsv();
  assert(csv.includes('owner_name') && csv.includes('שלמה'), 'csv export failed');

  const dashboard = await listDashboard();
  assert(dashboard.length === 1, 'dashboard should show family');
  await deleteFamilyByToken(created.family.managementToken);
  const afterDelete = await listDashboard();
  assert(afterDelete.length === 0, 'family should be deleted');
  console.log('✅ מלאכי selftest passed');
}

run().catch((err) => {
  console.error('❌ selftest failed:', err);
  process.exit(1);
});
