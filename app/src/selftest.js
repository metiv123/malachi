import { rm } from 'node:fs/promises';
import path from 'node:path';
import { addContactByToken, addElderByToken, createFamily, createUserAccount, deleteFamilyByToken, exportFamiliesCsv, getCheckHistoryByToken, getFamilyByToken, getOutboundMessagesByToken, handleElderResponse, listDashboard, loginFamily, optOutByPhone, processDueChecks, processNoResponses, sendCheckNow, setContactOptIn, setElderActiveByToken, setFamilyPasswordByToken, setOptIn, systemReadiness, updateElderByToken, weeklyReportByToken } from './malachi.js';
import { extractWhatsAppButtonEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapTextToIntent } from './metaWebhook.js';
import { processWhatsAppWebhookPayload } from './webhookProcessor.js';
import { getHodayaAgentStatus, prepareHodayaWindowOpenTemplate, sendHodayaAgentReply } from './hodayaAgent.js';
import { loadDb, saveDb } from './store.js';
import { config } from './config.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function reset() {
  await rm(path.resolve(process.cwd(), 'data/db.json'), { force: true });
  await saveDb({ families: [], elders: [], contacts: [], checks: [], audit: [], outboundMessages: [], waitlist: [], feedback: [], errors: [] });
}

async function run() {
  await reset();
  const accountOnly = await createUserAccount({ ownerName: 'משתמש חדש', ownerEmail: 'new-user@example.com', password: 'strongpass123', ownerPhone: '0521111111', marketingEmailConsent: true, source: 'unit_test' });
  assert(accountOnly.family.id, 'account-only family id missing');
  assert(accountOnly.family.marketingEmailConsent === true, 'marketing consent should be saved');
  const accountLogin = await loginFamily({ email: 'new-user@example.com', password: 'strongpass123' });
  assert(accountLogin.managementToken === accountOnly.family.managementToken, 'account-only login should work');
  let emptyAccount = await getFamilyByToken(accountOnly.family.managementToken);
  assert(emptyAccount.elders.length === 0, 'new account should start without elders');
  const addedElder = await addElderByToken(accountOnly.family.managementToken, { elderName: 'אמא', elderPhone: '0522222222', dailyCheckTime: '08:30', contactName: 'משתמש חדש', contactPhone: '0521111111', skipOptIn: true, skipContactOptIn: true, elderConsent: true });
  assert(addedElder.elder.id && addedElder.contact.id, 'add elder should create elder and contact');
  await deleteFamilyByToken(accountOnly.family.managementToken);

  const created = await createFamily({
    ownerName: 'שלמה',
    ownerEmail: 'family@example.com',
    password: 'strongpass123',
    ownerPhone: '+972501111111',
    elderName: 'רחל',
    elderPhone: '+972502222222',
    dailyCheckTime: '09:00',
    contactName: 'שלמה',
    contactPhone: '+972501111111',
    consent: 'on',
    source: 'facebook',
    ref: 'metiv_page',
    utm_source: 'facebook',
    utm_medium: 'organic',
    utm_campaign: 'malachi_beta',
    utm_content: 'first_post',
    utm_term: 'elder_check'
  });
  assert(created.family.id, 'family id missing');
  assert(created.family.managementToken, 'management token missing');
  assert(created.family.passwordHash, 'password hash missing');
  assert(created.family.source === 'facebook', 'family source should be tracked');
  const login = await loginFamily({ email: 'family@example.com', password: 'strongpass123' });
  assert(login.managementToken === created.family.managementToken, 'login should return management token');
  await setFamilyPasswordByToken(created.family.managementToken, { email: 'family2@example.com', password: 'newpass123' });
  const login2 = await loginFamily({ email: 'family2@example.com', password: 'newpass123' });
  assert(login2.managementToken === created.family.managementToken, 'updated login should work');
  assert(created.family.attribution?.utm_campaign === 'malachi_beta', 'utm campaign should be tracked');
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
  assert(created.contact.optInStatus === 'pending', 'contact opt-in should start pending');
  assert(created.family.ownerPhone === '+972501111111', 'owner phone should normalize');
  assert(created.contact.whatsappPhone === '+972501111111', 'contact phone should normalize');

  const optInPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: '972502222222', id: 'wamid.optin', timestamp: '1', interactive: { button_reply: { id: 'approve_optin', title: 'מאשר/ת' } } }] } }] }] };
  const optInHandled = await processWhatsAppWebhookPayload(optInPayload);
  assert(optInHandled[0]?.status === 'opt_in_approved', 'processor should approve opt-in from trial-number style webhook');
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].optInStatus === 'approved', 'webhook opt-in should approve elder');

  const contactOptInPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972501111111', id: 'wamid.contact.optin', timestamp: '1', button: { payload: `approve_contact_optin:${created.contact.id}`, text: 'מאשר/ת' } }] } }] }] };
  const contactOptInHandled = await processWhatsAppWebhookPayload(contactOptInPayload);
  assert(contactOptInHandled[0]?.status === 'contact_opt_in_approved', 'processor should approve contact opt-in');
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].contacts[0].optInStatus === 'approved', 'webhook contact opt-in should approve contact');
  let duplicateRejected = false;
  try {
    await addContactByToken(created.family.managementToken, created.elder.id, { contactName: 'כפול', contactPhone: '+972501111111' });
  } catch (err) {
    duplicateRejected = String(err.message).includes('כבר קיים');
  }
  assert(duplicateRejected, 'duplicate contact phone for same elder should be rejected');

  await setOptIn(created.elder.id, true);
  await setContactOptIn(created.contact.id, true);
  await updateElderByToken(created.family.managementToken, created.elder.id, { dailyCheckTime: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) });
  const scheduled = await processDueChecks(new Date());
  assert(scheduled.length === 1, 'scheduled due check should send once');
  const scheduledAgain = await processDueChecks(new Date());
  assert(scheduledAgain.length === 0, 'scheduled due check should not duplicate');

  const check = await sendCheckNow(created.elder.id);
  assert(check.status === 'sent', 'check should be sent');

  const previousHodayaEnabled = config.hodayaAgent.enabled;
  const previousHodayaPhone = config.hodayaAgent.phone;
  const previousHodayaTemplate = config.hodayaAgent.windowTemplate;
  config.hodayaAgent.enabled = true;
  config.hodayaAgent.phone = '+972546984743';
  config.hodayaAgent.windowTemplate = '';
  const hodayaDryRun = await prepareHodayaWindowOpenTemplate({ dryRun: true });
  assert(hodayaDryRun.templateName === config.meta.templates.dailyCheck, 'hodaya POC should use existing daily check template by default');
  assert(hodayaDryRun.buttonPayload === 'daily_ok', 'hodaya POC should use daily_ok/אני בסדר button');
  const hodayaPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972546984743', id: 'wamid.hodaya.window', timestamp: '1', button: { payload: 'daily_ok', text: 'אני בסדר' } }] } }] }] };
  const hodayaHandled = await processWhatsAppWebhookPayload(hodayaPayload);
  assert(hodayaHandled[0]?.status === 'hodaya_agent_window_opened', 'hodaya inbound should route to isolated agent');
  let db = await loadDb();
  assert(db.hodayaAgent?.inboundMessages?.some((m) => m.messageId === 'wamid.hodaya.window'), 'hodaya inbound should be stored only in hodayaAgent state');
  assert(!db.inboundMessages?.some((m) => m.messageId === 'wamid.hodaya.window'), 'hodaya inbound must not enter Malachi inboundMessages');
  assert(db.checks.find((c) => c.id === check.id).status === 'sent', 'hodaya daily_ok must not close a Malachi elder check');
  const hodayaStatus = await getHodayaAgentStatus();
  assert(hodayaStatus.enabled === true && hodayaStatus.in24hWindow === true, 'hodaya status should show open 24h window');
  const hodayaReplyDryRun = await sendHodayaAgentReply({ message: 'היי הודיה, השיחה פתוחה.', dryRun: true });
  assert(hodayaReplyDryRun.eligible === true, 'hodaya reply dry-run should be eligible inside the 24h window');
  const hodayaReply = await sendHodayaAgentReply({ message: 'היי הודיה, השיחה פתוחה.', dryRun: false });
  assert(hodayaReply.sent === true, 'hodaya reply should send in mock mode during selftest');
  db = await loadDb();
  assert(db.hodayaAgent?.outboundMessages?.some((m) => m.kind === 'hodaya_agent_reply'), 'hodaya reply should be stored only under hodayaAgent outbound');
  assert(!db.outboundMessages?.some((m) => m.kind === 'hodaya_agent_reply'), 'hodaya reply must not enter general Malachi outboundMessages');
  config.hodayaAgent.enabled = previousHodayaEnabled;
  config.hodayaAgent.phone = previousHodayaPhone;
  config.hodayaAgent.windowTemplate = previousHodayaTemplate;

  await handleElderResponse({ elderId: created.elder.id, checkId: check.id, response: 'ok' });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === check.id).status === 'ok', 'check should become ok');
  assert(db.outboundMessages.some((m) => m.kind === 'ok_ack'), 'ok ack missing');
  assert(!db.outboundMessages.some((m) => ['family_greeting', 'distress_alert', 'no_response_alert'].includes(m.kind) && m.meta?.checkId === check.id), 'ok should not notify family');

  const previousDailyCheckMode = config.dailyCheckMode;
  config.dailyCheckMode = 'single_ok';
  const singleOkCheck = await sendCheckNow(created.elder.id);
  db = await loadDb();
  const singleOkOutbound = db.outboundMessages.find((m) => m.meta?.checkId === singleOkCheck.id && m.kind === 'daily_check');
  assert(singleOkOutbound?.buttons?.length === 1, 'single ok mode should send one button');
  assert(singleOkOutbound.buttons[0].id === 'daily_ok', 'single ok button id should be daily_ok');
  assert(singleOkOutbound.buttons[0].title === 'אני בסדר', 'single ok button title should be אני בסדר');
  assert(singleOkOutbound.meta?.mode === 'single_ok', 'single ok outbound should record mode');
  const singleOkPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: '972502222222', id: 'wamid.single.ok', timestamp: '1', interactive: { button_reply: { id: 'daily_ok', title: 'אני בסדר' } } }] } }] }] };
  const singleOkHandled = await processWhatsAppWebhookPayload(singleOkPayload);
  assert(singleOkHandled[0]?.status === 'response_recorded', 'single ok webhook should record response');
  db = await loadDb();
  assert(db.checks.find((c) => c.id === singleOkCheck.id).status === 'ok', 'single ok check should become ok');
  assert(!db.outboundMessages.some((m) => ['family_greeting', 'distress_alert', 'no_response_alert'].includes(m.kind) && m.meta?.checkId === singleOkCheck.id), 'single ok should not notify family');
  config.dailyCheckMode = previousDailyCheckMode;

  const checkGreeting = await sendCheckNow(created.elder.id);
  await handleElderResponse({ elderId: created.elder.id, checkId: checkGreeting.id, response: 'greeting' });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === checkGreeting.id).status === 'greeting_sent', 'check should become greeting_sent');
  assert(db.outboundMessages.some((m) => m.kind === 'family_greeting'), 'family greeting missing');

  const checkViaWebhook = await sendCheckNow(created.elder.id);
  const processorPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: '972502222222', id: 'wamid.processor.ok', timestamp: '1', interactive: { button_reply: { id: 'daily_ok', title: 'הכול בסדר' } } }] } }] }] };
  const processorHandled = await processWhatsAppWebhookPayload(processorPayload);
  assert(processorHandled[0]?.status === 'response_recorded', 'processor should record daily check button response');
  db = await loadDb();
  assert(db.checks.find((c) => c.id === checkViaWebhook.id).status === 'ok', 'webhook processor should mark latest open check ok');
  assert(db.audit.some((evt) => evt.type === 'whatsapp_webhook_received'), 'webhook processor audit event missing');

  const duplicate = await createFamily({
    ownerName: 'שלמה 2',
    ownerPhone: '+972501111111',
    elderName: 'רחל כפולה',
    elderPhone: '+972502222222',
    dailyCheckTime: '09:00',
    contactName: 'שלמה 2',
    contactPhone: '+972501111111',
    consent: 'on',
    skipOptIn: true
  });
  const duplicateCheck = await sendCheckNow(duplicate.elder.id);
  const duplicatePayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972502222222', id: 'wamid.duplicate.distress', timestamp: '1', button: { payload: 'daily_distress', text: 'מצוקה' } }] } }] }] };
  const duplicateHandled = await processWhatsAppWebhookPayload(duplicatePayload);
  assert(duplicateHandled[0]?.check?.id === duplicateCheck.id, 'processor should prefer latest open check when phone is duplicated');
  db = await loadDb();
  assert(db.checks.find((c) => c.id === duplicateCheck.id).status === 'distress', 'duplicate phone latest open check should become distress');
  await deleteFamilyByToken(duplicate.family.managementToken);

  const check3 = await sendCheckNow(created.elder.id);
  await processNoResponses({ graceMinutes: 0 });
  await processNoResponses({ graceMinutes: 0 });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === check3.id).status === 'sent', 'check should stay open while reminders are sent');
  assert(db.outboundMessages.filter((m) => m.kind === 'daily_reminder' && m.meta?.checkId === check3.id).length === 2, 'daily reminders missing');
  await processNoResponses({ graceMinutes: 0 });
  db = await loadDb();
  assert(db.checks.find((c) => c.id === check3.id).status === 'no_response', 'check should become no_response after reminder attempts');
  assert(db.outboundMessages.some((m) => m.kind === 'no_response_alert' && m.meta?.checkId === check3.id), 'no response alert missing');

  const webhookPayload = { entry: [{ changes: [{ value: { messages: [{ from: '972502222222', id: 'wamid.test', timestamp: '1', interactive: { button_reply: { id: 'daily_ok', title: 'הכול בסדר' } } }] } }] }] };
  const buttons = extractWhatsAppButtonEvents(webhookPayload);
  assert(buttons.length === 1, 'webhook button extraction failed');
  assert(mapButtonToResponse(buttons[0]) === 'ok', 'webhook button mapping failed');

  const templateButtonPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972502222222', id: 'wamid.template.button', timestamp: '1', button: { payload: 'daily_distress', text: 'מצוקה' } }] } }] }] };
  const templateButtons = extractWhatsAppButtonEvents(templateButtonPayload);
  assert(templateButtons.length === 1, 'template quick reply button extraction failed');
  assert(mapButtonToResponse(templateButtons[0]) === 'distress', 'template quick reply button mapping failed');

  const greetingButtonPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972502222222', id: 'wamid.template.greeting', timestamp: '1', button: { payload: 'daily_greeting', text: 'שלח ד״ש למשפחה' } }] } }] }] };
  const greetingButtons = extractWhatsAppButtonEvents(greetingButtonPayload);
  assert(mapButtonToResponse(greetingButtons[0]) === 'greeting', 'greeting button mapping failed');

  const history = await getCheckHistoryByToken(created.family.managementToken, created.elder.id);
  assert(history.length >= 3, 'history should include checks');
  const outbound = await getOutboundMessagesByToken(created.family.managementToken, created.elder.id);
  assert(outbound.length >= 3, 'outbound message log should include messages');
  const readiness = await systemReadiness();
  assert(readiness.counts.families === 1, 'readiness should count family');

  const weekly = await weeklyReportByToken(created.family.managementToken);
  assert(weekly.elders[0].totals.checks >= 3, 'weekly report should count checks');
  assert(weekly.elders[0].totals.noResponses >= 1, 'weekly report should count no responses');
  assert(weekly.elders[0].totals.greetings >= 1, 'weekly report should count greetings');

  const textPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '972502222222', id: 'wamid.text', timestamp: '1', text: { body: 'הסרה' } }] } }] }] };
  const texts = extractWhatsAppTextEvents(textPayload);
  assert(texts.length === 1, 'text extraction failed');
  assert(mapTextToIntent(texts[0]) === 'opt_out', 'opt-out text mapping failed');
  const optOut = await optOutByPhone('972502222222');
  assert(optOut.found === true, 'opt out should find elder');

  const csv = await exportFamiliesCsv();
  assert(csv.includes('utm_campaign') && csv.includes('malachi_beta') && csv.includes('owner_name') && csv.includes('שלמה'), 'csv export failed');

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
