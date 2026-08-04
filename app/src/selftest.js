import { rm } from 'node:fs/promises';
import path from 'node:path';
import { addContactByToken, addElderByToken, adminConversations, adminSimpleOverview, betaStatus, cancelOpenChecks, createFamily, createUserAccount, deleteFamilyByToken, exportFamiliesCsv, getCheckHistoryByToken, getFamilyByToken, getOutboundMessagesByToken, handleElderResponse, listDashboard, loginFamily, normalizeFamilyContactOptIns, optOutByPhone, processDueChecks, processNoResponses, resendElderOptInByToken, sendCheckNow, setContactOptIn, setElderActiveByToken, setFamilyPasswordByToken, setOptIn, systemReadiness, updateElderByToken, weeklyReportByToken } from './malachi.js';
import { extractWhatsAppButtonEvents, extractWhatsAppTextEvents, mapButtonToResponse, mapTextToIntent } from './metaWebhook.js';
import { processWhatsAppWebhookPayload } from './webhookProcessor.js';
import { getHodayaAgentStatus, prepareHodayaWindowOpenTemplate, sendHodayaAgentReply, triggerHodayaEventDrivenTurn } from './hodayaAgent.js';
import { loadDb, saveDb } from './store.js';
import { config } from './config.js';
import { analyticsReport, publicMarketingStatus, recordAnalyticsEvent } from './analytics.js';
import { createServer } from './server.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function reset() {
  await rm(path.resolve(process.cwd(), 'data/db.json'), { force: true });
  await saveDb({ families: [], elders: [], contacts: [], checks: [], audit: [], outboundMessages: [], waitlist: [], feedback: [], errors: [] });
}

async function withHttpServer(callback) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function run() {
  await reset();
  await recordAnalyticsEvent({ event: 'page_view', market: 'il', path: '/', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'page_view', market: 'il', path: '/', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'engaged_view', market: 'il', path: '/', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'join_click', market: 'il', path: '/', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'demo_click', market: 'il', path: '/', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'demo_interaction', market: 'il', path: '/demo.html', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'demo_join_click', market: 'il', path: '/demo.html', utm_source: 'facebook', utm_campaign: 'israel_launch' }, { ip: '203.0.113.10', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'page_view', market: 'uk', path: '/', utm_source: 'community' }, { ip: '198.51.100.20', userAgent: 'Selftest Browser UK' });
  await recordAnalyticsEvent({ event: 'signup_form_view', market: 'uk', path: '/en/create-user.html', utm_source: 'community', utm_campaign: 'uk_pilot' }, { ip: '198.51.100.20', userAgent: 'Selftest Browser UK' });
  await recordAnalyticsEvent({ event: 'signup_form_engaged', market: 'uk', path: '/en/create-user.html', utm_source: 'community', utm_campaign: 'uk_pilot' }, { ip: '198.51.100.20', userAgent: 'Selftest Browser UK' });
  await recordAnalyticsEvent({ event: 'signup_complete', market: 'uk', path: '/en/create-user.html', utm_source: 'community', utm_campaign: 'uk_pilot' }, { ip: '198.51.100.20', userAgent: 'Selftest Browser UK' });
  await recordAnalyticsEvent({ event: 'page_view', market: 'uk', path: '/', test: true }, { ip: '192.0.2.99', userAgent: 'Selftest Browser' });
  await recordAnalyticsEvent({ event: 'page_view', market: 'uk', path: '/' }, { ip: '192.0.2.88', userAgent: 'Googlebot' });
  const analytics = await analyticsReport({ days: 30 });
  const israelAnalytics = analytics.markets.find((item) => item.market === 'il');
  const ukAnalytics = analytics.markets.find((item) => item.market === 'uk');
  assert(israelAnalytics.pageViews === 2 && israelAnalytics.visitors === 1, 'Israeli analytics should count views and deduplicate visitors');
  assert(israelAnalytics.events.join_click === 1 && israelAnalytics.sources.facebook === 2, 'Israeli analytics should count clicks and sources');
  assert(israelAnalytics.sourceFunnels.facebook.events.join_click === 1 && israelAnalytics.sourceFunnels.facebook.events.demo_interaction === 1, 'admin analytics should expose a source-level funnel');
  assert(israelAnalytics.campaignFunnels.israel_launch.events.demo_join_click === 1, 'admin analytics should expose a campaign-level funnel');
  assert(ukAnalytics.pageViews === 1 && ukAnalytics.events.signup_form_view === 1 && ukAnalytics.events.signup_form_engaged === 1 && ukAnalytics.events.signup_complete === 1, 'UK analytics should stay separate, expose form entry and engagement, and ignore tests/bots');
  assert(ukAnalytics.sourceFunnels.community.events.signup_complete === 1, 'UK source funnel should attribute signup completion');
  const publicStatus = await publicMarketingStatus({ days: 30 });
  const publicIsrael = publicStatus.markets.find((item) => item.market === 'il');
  const publicUk = publicStatus.markets.find((item) => item.market === 'uk');
  assert(publicIsrael.visitors === 1 && publicIsrael.pageViews === 2 && publicIsrael.engagedViews === 1 && publicIsrael.demoClicks === 1 && publicIsrael.demoInteractions === 1 && publicIsrael.demoJoinClicks === 1 && publicIsrael.joinClicks === 1, 'public Israel marketing status should expose aggregate funnel totals');
  assert(publicUk.visitors === 1 && publicUk.signupFormViews === 1 && publicUk.signupFormEngaged === 1 && publicUk.signupSubmitAttempts === 0 && publicUk.signupCompletes === 1, 'public UK marketing status should expose aggregate form-view, engagement and submit-attempt totals');
  assert(!('sources' in publicIsrael) && !('campaigns' in publicIsrael) && !('daily' in publicStatus), 'public marketing status must not expose attribution or daily records');
  const accountOnly = await createUserAccount({ ownerName: 'משתמש חדש', ownerEmail: 'new-user@example.com', password: 'strongpass123', ownerPhone: '0521111111', termsConsent: true, privacyConsent: true, marketingEmailConsent: true, source: 'unit_test' });
  assert(accountOnly.family.id, 'account-only family id missing');
  assert(accountOnly.family.marketingEmailConsent === true, 'marketing consent should be saved');
  const accountLogin = await loginFamily({ email: 'new-user@example.com', password: 'strongpass123' });
  assert(accountLogin.managementToken === accountOnly.family.managementToken, 'account-only login should work');
  let emptyAccount = await getFamilyByToken(accountOnly.family.managementToken);
  assert(emptyAccount.elders.length === 0, 'new account should start without elders');
  await withHttpServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/elders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `malachi_session=${encodeURIComponent(accountOnly.family.managementToken)}` },
      body: JSON.stringify({ elderName: 'אמא', elderPhone: '0522222222', dailyCheckTime: '08:30', contactName: 'משתמש חדש', contactPhone: '0521111111', skipOptIn: true, skipContactOptIn: true, elderConsent: true })
    });
    const payload = await response.json();
    assert(response.status === 400 && payload.error === 'WhatsApp approval cannot be bypassed by a client request', 'public elder API must reject opt-in bypass fields');
  });
  emptyAccount = await getFamilyByToken(accountOnly.family.managementToken);
  assert(emptyAccount.elders.length === 0, 'rejected bypass request must not create an elder');
  const addedElder = await addElderByToken(accountOnly.family.managementToken, { elderName: 'אמא', elderPhone: '0522222222', dailyCheckTime: '08:30', contactName: 'משתמש חדש', contactPhone: '0521111111', skipOptIn: true, skipContactOptIn: true, elderConsent: true }, { allowOptInBypass: true });
  assert(addedElder.elder.id && addedElder.contact.id, 'add elder should create elder and contact');
  assert(addedElder.elder.optInStatus === 'approved' && addedElder.contact.optInStatus === 'approved', 'trusted test setup should retain an explicit internal opt-in bypass');
  await deleteFamilyByToken(accountOnly.family.managementToken);

  const bypassProbe = await createFamily({
    ownerName: 'Bypass probe', ownerPhone: '+972504444444', elderName: 'Consent probe', elderPhone: '+972505555555', dailyCheckTime: '09:15',
    contactName: 'Contact probe', contactPhone: '+972506666666', consent: 'on', skipOptIn: true, skipContactOptIn: true, source: 'security_selftest'
  });
  assert(bypassProbe.elder.optInStatus === 'pending' && bypassProbe.contact.optInStatus === 'pending', 'domain layer must ignore untrusted opt-in bypass fields');
  await deleteFamilyByToken(bypassProbe.family.managementToken);

  const englishAccount = await createUserAccount({
    ownerName: 'Alex',
    ownerEmail: 'alex-uk@example.com',
    password: 'strongpass123',
    ownerPhone: '+447700900111',
    language: 'en_US',
    country: 'GB',
    pilotCohort: 'uk_free_2026',
    pilotFree: true,
    termsConsent: true,
    privacyConsent: true,
    source: 'uk_selftest'
  });
  assert(englishAccount.family.language === 'en_US', 'English account language should be stored');
  assert(englishAccount.family.pilotFree === true, 'UK pilot should be marked free');
  const englishElder = await addElderByToken(englishAccount.family.managementToken, {
    elderName: 'Margaret',
    elderPhone: '+447700900222',
    dailyCheckTime: '09:00',
    timezone: 'Europe/London',
    contactName: 'Alex',
    contactPhone: '+447700900111',
    skipOptIn: true,
    skipContactOptIn: true,
    elderConsent: true
  }, { allowOptInBypass: true });
  assert(englishElder.elder.language === 'en_US', 'English elder should inherit account language');
  const englishCheck = await sendCheckNow(englishElder.elder.id);
  const englishMessages = await getOutboundMessagesByToken(englishAccount.family.managementToken);
  const englishOutbound = englishMessages.find((message) => message.kind === 'daily_check' && message.meta?.checkId === englishCheck.id);
  assert(englishOutbound?.meta?.language === 'en_US', 'English check should use en_US');
  assert(englishOutbound?.meta?.templateName === 'daily_check_en', 'English check should select approved English template');
  assert(englishOutbound?.buttons?.[0]?.title === 'I’m okay', 'English check should use English button copy');
  const unsupportedEnglishResponse = await handleElderResponse({ elderId: englishElder.elder.id, checkId: englishCheck.id, response: 'distress' });
  assert(unsupportedEnglishResponse === null, 'English pilot should ignore unsupported non-OK intents');
  const englishAfterUnsupported = await getCheckHistoryByToken(englishAccount.family.managementToken, englishElder.elder.id);
  assert(englishAfterUnsupported.find((check) => check.id === englishCheck.id)?.status === 'sent', 'Unsupported English intent must leave the check open for reminders');
  const ukStatus = await betaStatus('uk_free_2026');
  assert(ukStatus.used === 1 && ukStatus.maxFamilies === config.ukPilotMaxFamilies, 'UK cohort status should be separate');
  await deleteFamilyByToken(englishAccount.family.managementToken);

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
  let pendingCheckRejected = false;
  try {
    await sendCheckNow(created.elder.id);
  } catch (err) {
    pendingCheckRejected = String(err.message).includes('opt-in is not approved');
  }
  assert(pendingCheckRejected, 'manual check should be blocked until elder opt-in is approved');
  assert(created.family.ownerPhone === '+972501111111', 'owner phone should normalize');
  assert(created.contact.whatsappPhone === '+972501111111', 'contact phone should normalize');

  const optInPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: '972502222222', id: 'wamid.optin', timestamp: '1', interactive: { button_reply: { id: 'approve_optin', title: 'מאשר/ת' } } }] } }] }] };
  const optInHandled = await processWhatsAppWebhookPayload(optInPayload);
  assert(optInHandled[0]?.status === 'opt_in_approved', 'processor should approve opt-in from trial-number style webhook');
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].optInStatus === 'approved', 'webhook opt-in should approve elder');

  const declineRetryPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: '972502222222', id: 'wamid.optin.decline.retry', timestamp: '2', interactive: { button_reply: { id: 'decline_optin', title: 'לא מעוניין/ת' } } }] } }] }] };
  const declineHandled = await processWhatsAppWebhookPayload(declineRetryPayload);
  assert(declineHandled[0]?.status === 'opt_in_declined', 'processor should decline opt-in once');
  let overview = await adminSimpleOverview();
  assert(overview.summary.pendingOptIns === 1, 'pending summary should count only pending contacts, not declined elders');
  assert(overview.summary.declinedOptIns === 1, 'declined summary should count declined elders separately');
  await resendElderOptInByToken(created.family.managementToken, created.elder.id);
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].optInStatus === 'pending', 'resend opt-in should move elder back to pending');
  const duplicateDeclineHandled = await processWhatsAppWebhookPayload(declineRetryPayload);
  assert(duplicateDeclineHandled.length === 0, 'duplicate webhook messageId should be ignored');
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].optInStatus === 'pending', 'duplicate old decline must not flip resent opt-in back to declined');
  await setOptIn(created.elder.id, true);

  const contactOptInPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'button', from: '972501111111', id: 'wamid.contact.optin', timestamp: '1', button: { payload: `approve_contact_optin:${created.contact.id}`, text: 'מאשר/ת' } }] } }] }] };
  const contactOptInHandled = await processWhatsAppWebhookPayload(contactOptInPayload);
  assert(contactOptInHandled[0]?.status === 'contact_opt_in_approved', 'processor should approve contact opt-in');
  updatedFamily = await getFamilyByToken(created.family.managementToken);
  assert(updatedFamily.elders[0].contacts[0].optInStatus === 'approved', 'webhook contact opt-in should approve contact');
  const contactOptInCountBeforeInherited = (await getOutboundMessagesByToken(created.family.managementToken)).filter((message) => message.kind === 'contact_optin').length;
  const inheritedContactElder = await addElderByToken(created.family.managementToken, { elderName: 'סבתא', elderPhone: '0523333333', dailyCheckTime: '11:00', contactName: 'שלמה', contactPhone: '+972501111111', skipOptIn: true, elderConsent: true }, { allowOptInBypass: true });
  assert(inheritedContactElder.contact.optInStatus === 'approved', 'same family approved contact phone should inherit approval');
  const contactOptInCountAfterInherited = (await getOutboundMessagesByToken(created.family.managementToken)).filter((message) => message.kind === 'contact_optin').length;
  assert(contactOptInCountAfterInherited === contactOptInCountBeforeInherited, 'inherited approved contact should not receive duplicate contact opt-in');
  let duplicateRejected = false;
  try {
    await addContactByToken(created.family.managementToken, created.elder.id, { contactName: 'כפול', contactPhone: '+972501111111' });
  } catch (err) {
    duplicateRejected = String(err.message).includes('כבר קיים');
  }
  assert(duplicateRejected, 'duplicate contact phone for same elder should be rejected');

  const normalizedContacts = await normalizeFamilyContactOptIns({ ownerEmail: 'family2@example.com', dryRun: true });
  assert(normalizedContacts.changedCount === 0, 'already inherited family contact approvals should not need normalization');
  await setOptIn(created.elder.id, true);
  await setContactOptIn(created.contact.id, true);
  await updateElderByToken(created.family.managementToken, inheritedContactElder.elder.id, { dailyCheckTime: '23:59', shomerShabbat: '' });
  await updateElderByToken(created.family.managementToken, created.elder.id, { dailyCheckTime: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) });
  const scheduled = await processDueChecks(new Date());
  assert(scheduled.length === 1, 'scheduled due check should send once');
  const scheduledAgain = await processDueChecks(new Date());
  assert(scheduledAgain.length === 0, 'scheduled due check should not duplicate');

  await updateElderByToken(created.family.managementToken, inheritedContactElder.elder.id, { dailyCheckTime: '09:00', shomerShabbat: '' });
  const catchUpScheduled = await processDueChecks(new Date('2026-07-26T10:00:00.000Z'));
  assert(catchUpScheduled.some((c) => c.elderId === inheritedContactElder.elder.id), 'scheduler should catch up after the exact minute passed');
  const catchUpAgain = await processDueChecks(new Date('2026-07-26T10:01:00.000Z'));
  assert(!catchUpAgain.some((c) => c.elderId === inheritedContactElder.elder.id), 'catch-up scheduler should not duplicate same local day');

  await updateElderByToken(created.family.managementToken, inheritedContactElder.elder.id, { dailyCheckTime: '09:00', shomerShabbat: 'on' });
  const beforeSaturdayNight = await processDueChecks(new Date('2026-08-01T17:59:00.000Z'));
  assert(!beforeSaturdayNight.some((c) => c.elderId === inheritedContactElder.elder.id), 'Shabbat-observant elder should not receive regular Saturday check before 21:00');
  const saturdayNight = await processDueChecks(new Date('2026-08-01T18:00:00.000Z'));
  assert(saturdayNight.some((c) => c.elderId === inheritedContactElder.elder.id), 'Shabbat-observant elder should receive Saturday check at 21:00 Israel time');

  const check = await sendCheckNow(created.elder.id);
  assert(check.status === 'sent', 'check should be sent');

  const previousHodayaEnabled = config.hodayaAgent.enabled;
  const previousHodayaPhone = config.hodayaAgent.phone;
  const previousHodayaTemplate = config.hodayaAgent.windowTemplate;
  const previousHodayaEventDriven = config.hodayaAgent.eventDrivenEnabled;
  const previousHodayaEventHookUrl = config.hodayaAgent.eventHookUrl;
  const previousHodayaEventHookToken = config.hodayaAgent.eventHookToken;
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

  const hodayaTextPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '972546984743', id: 'wamid.hodaya.text', timestamp: '1', text: { body: 'תזכירי לי לשתות מים' } }] } }] }] };
  const hodayaTextHandled = await processWhatsAppWebhookPayload(hodayaTextPayload);
  assert(hodayaTextHandled[0]?.status === 'hodaya_agent_message_received', 'hodaya text should be treated as actionable message, not window opener');
  db = await loadDb();
  assert(db.hodayaAgent?.inboundMessages?.some((m) => m.messageId === 'wamid.hodaya.text' && m.text === 'תזכירי לי לשתות מים'), 'hodaya text should be stored in isolated Hodaya inbound');
  assert(!db.inboundMessages?.some((m) => m.messageId === 'wamid.hodaya.text'), 'hodaya text must not enter general Malachi inboundMessages');
  config.hodayaAgent.eventDrivenEnabled = true;
  config.hodayaAgent.eventHookUrl = 'https://example.invalid/hooks/agent';
  config.hodayaAgent.eventHookToken = 'test-token';
  const hodayaEventDryRun = await triggerHodayaEventDrivenTurn({ reason: 'selftest', dryRun: true });
  assert(hodayaEventDryRun.triggered === true && hodayaEventDryRun.dryRun === true, 'hodaya event-driven trigger should be eligible in dry-run');
  config.hodayaAgent.eventHookUrl = '';
  const hodayaEventMissingHook = await triggerHodayaEventDrivenTurn({ reason: 'selftest_missing_hook', dryRun: true });
  assert(hodayaEventMissingHook.triggered === false && hodayaEventMissingHook.reason === 'missing_hook_config', 'hodaya event-driven should fail closed without hook config');

  config.hodayaAgent.enabled = previousHodayaEnabled;
  config.hodayaAgent.phone = previousHodayaPhone;
  config.hodayaAgent.windowTemplate = previousHodayaTemplate;
  config.hodayaAgent.eventDrivenEnabled = previousHodayaEventDriven;
  config.hodayaAgent.eventHookUrl = previousHodayaEventHookUrl;
  config.hodayaAgent.eventHookToken = previousHodayaEventHookToken;

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
  const singleOkReaction = db.outboundMessages.find((m) => m.kind === 'ok_reaction' && m.meta?.checkId === singleOkCheck.id);
  assert(singleOkReaction?.meta?.inboundMessageId === 'wamid.single.ok', 'single ok should react to the inbound WhatsApp message');
  assert(singleOkReaction?.meta?.emoji === '❤️', 'single ok reaction should use heart emoji');
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
  assert(db.outboundMessages.some((m) => m.kind === 'ok_reaction' && m.meta?.checkId === checkViaWebhook.id && m.meta?.inboundMessageId === 'wamid.processor.ok'), 'webhook ok should send emoji reaction instead of a separate routine ack');
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
  }, { allowOptInBypass: true });
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

  const websiteLeadPayload = { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '972509876543', id: 'wamid.website.lead', timestamp: String(Math.floor(Date.now()/1000)), text: { body: 'שלום מטיב, הגעתי דרך אתר מלאכי ואשמח לקבל פרטים.' } }] } }] }] };
  const websiteLeadHandled = await processWhatsAppWebhookPayload(websiteLeadPayload);
  assert(websiteLeadHandled[0]?.status === 'website_lead_ack_sent', 'website lead should receive automatic acknowledgement');
  db = await loadDb();
  assert(db.outboundMessages.filter((message) => message.kind === 'website_lead_auto_reply' && message.meta?.inboundMessageId === 'wamid.website.lead').length === 1, 'website lead acknowledgement should be recorded once');
  await processWhatsAppWebhookPayload(websiteLeadPayload);
  db = await loadDb();
  assert(db.outboundMessages.filter((message) => message.kind === 'website_lead_auto_reply' && message.meta?.inboundMessageId === 'wamid.website.lead').length === 1, 'duplicate website webhook must not send a duplicate acknowledgement');
  const conversations = await adminConversations();
  const leadConversation = conversations.find((conversation) => conversation.phone.endsWith('6543'));
  assert(leadConversation?.websiteLead === true && leadConversation.messages.some((message) => message.type === 'website_lead_auto_reply'), 'manager conversation should include website lead and auto reply');

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
