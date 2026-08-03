import { audit, id, loadDb, mutateDb, nowIso, saveDb } from './store.js';
import { randomUUID } from 'node:crypto';
import { sendBetaUpdate, sendContactOptIn, sendDailyCheck, sendDailyReminder, sendDistressAlert, sendFamilyGreeting, sendIncompleteSignupReminder, sendNoResponseAlert, sendOkAck, sendOkReaction, sendOptIn, sendWebsiteLeadAutoReply } from './whatsapp.js';
import { localParts } from './time.js';
import { validateJoinInput, isValidTime, normalizePhone } from './validators.js';
import { config } from './config.js';
import { hashPassword, verifyPassword } from './security.js';
import { createFirebaseAuthUser, deleteFirebaseAuthUser, updateFirebaseAuthUser } from './firebaseAuth.js';
import { consentRecord, legalVersions } from './legal.js';
import { purgeFamilyFromBackups } from './backup.js';

function requireField(input, field) {
  if (!input[field] || String(input[field]).trim() === '') {
    throw new Error(`Missing required field: ${field}`);
  }
  return String(input[field]).trim();
}

function cleanOptional(input, field) {
  return String(input?.[field] || '').trim();
}

function normalizeLanguage(value = '') {
  const language = String(value || '').trim().replace('-', '_').toLowerCase();
  return language.startsWith('en') ? 'en_US' : 'he';
}

function pilotIdentity(input = {}) {
  const language = normalizeLanguage(input.language || input.locale);
  const country = String(input.country || (language === 'en_US' ? 'GB' : 'IL')).trim().toUpperCase();
  const pilotCohort = String(input.pilotCohort || (language === 'en_US' ? 'uk_free_2026' : 'israel_beta_2026')).trim();
  return { language, country, pilotCohort, pilotFree: checkbox(input, 'pilotFree') || language === 'en_US' };
}

function leadAttribution(input = {}) {
  return {
    source: cleanOptional(input, 'source') || cleanOptional(input, 'utm_source') || cleanOptional(input, 'ref') || 'direct',
    ref: cleanOptional(input, 'ref'),
    utm_source: cleanOptional(input, 'utm_source'),
    utm_medium: cleanOptional(input, 'utm_medium'),
    utm_campaign: cleanOptional(input, 'utm_campaign'),
    utm_content: cleanOptional(input, 'utm_content'),
    utm_term: cleanOptional(input, 'utm_term')
  };
}

function checkbox(input = {}, field) {
  const value = input[field];
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
}

function effectiveDailyCheckTime(elder, date = new Date()) {
  const timezone = elder.timezone || 'Asia/Jerusalem';
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(date);
  if (elder.shomerShabbat && weekday === 'Sat') return '21:00';
  return elder.dailyCheckTime;
}

async function recordSendFailure(kind, to, err, meta = {}) {
  await mutateDb((db) => {
    db.outboundMessages.push({
      id: id('msg'),
      provider: config.whatsappProvider,
      kind,
      to: normalizePhone(to),
      body: '',
      buttons: [],
      status: 'failed',
      error: err.message,
      meta,
      createdAt: nowIso()
    });
    db.audit.push({ id: id('evt'), type: 'whatsapp_send_failed', payload: { kind, error: err.message, ...meta }, createdAt: nowIso() });
  });
}

function cleanEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function normalizeDigits(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function samePhone(a = '', b = '') {
  const left = normalizeDigits(a);
  const right = normalizeDigits(b);
  return Boolean(left && right && (left.endsWith(right) || right.endsWith(left)));
}

function maskPhone(phone = '') {
  const digits = normalizeDigits(phone);
  return digits ? `•••${digits.slice(-4)}` : '';
}

function isTestFamilyRecord(family = {}, elders = [], contacts = []) {
  const haystack = [family.ownerName, family.ownerEmail, family.source, ...elders.map((e) => e.name), ...contacts.map((c) => c.name), ...contacts.map((c) => c.relationship)].join(' ');
  return /בדיק|test|example\.invalid|openclaw_autonomy_test/i.test(haystack);
}

function familyContacts(db, familyId) {
  const elderIds = new Set((db.elders || []).filter((elder) => elder.familyId === familyId).map((elder) => elder.id));
  return (db.contacts || []).filter((contact) => elderIds.has(contact.elderId));
}

function approvedSameFamilyContact(db, familyId, phone) {
  const normalized = normalizePhone(phone);
  return familyContacts(db, familyId).find((contact) => normalizePhone(contact.whatsappPhone) === normalized && contact.optInStatus === 'approved') || null;
}

function alertDelayMinutes(input = {}) {
  const value = Number(input.noResponseGraceMinutes ?? input.reminderIntervalMinutes ?? input.alertDelayMinutes ?? config.reminderIntervalMinutes ?? 30);
  return [15, 30, 45, 60].includes(value) ? value : 30;
}

function alertRepeatCount(input = {}) {
  const value = Number(input.noResponseAlertRepeatCount ?? input.reminderAttemptCount ?? input.alertRepeatCount ?? config.reminderAttemptCount ?? 3);
  return [2, 3, 4].includes(value) ? value : 3;
}

function elderAlertDelay(elder, fallback = config.noResponseGraceMinutes) {
  if (Number(fallback) === 0) return 0;
  const value = Number(elder?.noResponseGraceMinutes || elder?.reminderIntervalMinutes || elder?.alertDelayMinutes || fallback || config.reminderIntervalMinutes || 30);
  return [15, 30, 45, 60].includes(value) ? value : Number(fallback || 30);
}

function elderAlertRepeatCount(elder) {
  const value = Number(elder?.noResponseAlertRepeatCount || elder?.reminderAttemptCount || elder?.alertRepeatCount || config.reminderAttemptCount || 3);
  return [2, 3, 4].includes(value) ? value : 3;
}

function requireAccountInput(input = {}) {
  const ownerName = requireField(input, 'ownerName');
  const ownerPhone = normalizePhone(requireField(input, 'ownerPhone'));
  const ownerEmail = cleanEmail(requireField(input, 'ownerEmail'));
  const password = String(requireField(input, 'password')).trim();
  if (!ownerEmail.includes('@')) throw new Error('מייל לא תקין');
  if (password.length < 8) throw new Error('הסיסמה צריכה לכלול לפחות 8 תווים');
  return { ownerName, ownerPhone, ownerEmail, password };
}

export async function createUserAccount(input = {}) {
  const { ownerName, ownerPhone, ownerEmail, password } = requireAccountInput(input);
  const attribution = leadAttribution(input);
  const pilot = pilotIdentity(input);
  const legalConsent = consentRecord(input);
  const created = await mutateDb((db) => {
    const cohortUsed = db.families.filter((family) => family.pilotCohort === pilot.pilotCohort).length;
    const cohortFull = pilot.pilotCohort === 'uk_free_2026' && cohortUsed >= config.ukPilotMaxFamilies;
    if (!config.betaOpen || db.families.length >= config.betaMaxFamilies || cohortFull) {
      const wait = { id: id('wait'), ownerName, ownerPhone, ownerEmail, ...pilot, ...attribution, ...legalConsent, createdAt: nowIso() };
      db.waitlist = db.waitlist || [];
      db.waitlist.push(wait);
      return { waitlist: true, wait };
    }
    if (db.families.some((f) => cleanEmail(f.ownerEmail) === ownerEmail)) throw new Error('המייל כבר מחובר למשתמש קיים');
    const family = {
      id: id('fam'),
      ownerName,
      ownerPhone,
      ownerEmail,
      emailVerified: false,
      firebaseAuthUid: '',
      marketingEmailConsent: Boolean(input.marketingEmailConsent),
      marketingEmailConsentAt: input.marketingEmailConsent ? nowIso() : null,
      ...legalConsent,
      passwordHash: hashPassword(password),
      managementToken: randomUUID(),
      tokenCreatedAt: nowIso(),
      tokenRevokedAt: null,
      tokenLastUsedAt: null,
      source: attribution.source,
      attribution,
      ...pilot,
      createdAt: nowIso()
    };
    db.families.push(family);
    db.audit.push({ id: id('evt'), type: 'user_account_created', payload: { familyId: family.id, attribution, marketingEmailConsent: family.marketingEmailConsent, termsVersion: family.termsVersion, privacyVersion: family.privacyVersion }, createdAt: nowIso() });
    return { family };
  });
  if (created.waitlist) return created;
  const authResult = await createFirebaseAuthUser({ email: ownerEmail, password, displayName: ownerName });
  if (authResult.uid) {
    await mutateDb((db) => {
      const family = db.families.find((item) => item.id === created.family.id);
      if (family) family.firebaseAuthUid = authResult.uid;
    });
    created.family.firebaseAuthUid = authResult.uid;
  }
  if (authResult.error) created.authWarning = `Firebase Auth: ${authResult.error}`;
  if (authResult.emailVerificationLink) created.emailVerificationLink = authResult.emailVerificationLink;
  return created;
}

function trustedOptInBypass(input = {}, options = {}) {
  const allowed = options.allowOptInBypass === true;
  return {
    elder: allowed && input.skipOptIn === true,
    contact: allowed && input.skipContactOptIn === true
  };
}

export async function createFamily(input, options = {}) {
  validateJoinInput(input);
  const optInBypass = trustedOptInBypass(input, options);
  const ownerName = requireField(input, 'ownerName');
  const ownerPhone = normalizePhone(requireField(input, 'ownerPhone'));
  const elderName = requireField(input, 'elderName');
  const elderPhone = normalizePhone(requireField(input, 'elderPhone'));
  const dailyCheckTime = requireField(input, 'dailyCheckTime');
  const contactName = String(input.contactName || ownerName).trim();
  const contactPhone = normalizePhone(input.contactPhone || ownerPhone);
  const attribution = leadAttribution(input);
  const pilot = pilotIdentity(input);
  const ownerEmail = String(input.ownerEmail || '').trim().toLowerCase();
  const password = String(input.password || '').trim();
  if (ownerEmail && !ownerEmail.includes('@')) throw new Error('מייל לא תקין');
  if (password && password.length < 8) throw new Error('הסיסמה צריכה לכלול לפחות 8 תווים');

  const created = await mutateDb((db) => {
    const cohortUsed = db.families.filter((family) => family.pilotCohort === pilot.pilotCohort).length;
    const cohortFull = pilot.pilotCohort === 'uk_free_2026' && cohortUsed >= config.ukPilotMaxFamilies;
    if (!config.betaOpen || db.families.length >= config.betaMaxFamilies || cohortFull) {
      const wait = { id: id('wait'), ownerName, ownerPhone, elderName, ...pilot, ...attribution, createdAt: nowIso() };
      db.waitlist = db.waitlist || [];
      db.waitlist.push(wait);
      return { waitlist: true, wait };
    }
    if (ownerEmail && db.families.some((f) => String(f.ownerEmail || '').trim().toLowerCase() === ownerEmail)) throw new Error('המייל כבר מחובר למשפחה קיימת');
    const family = {
      id: id('fam'),
      ownerName,
      ownerPhone,
      ownerEmail,
      emailVerified: false,
      marketingEmailConsent: Boolean(input.marketingEmailConsent),
      marketingEmailConsentAt: input.marketingEmailConsent ? nowIso() : null,
      passwordHash: password ? hashPassword(password) : '',
      managementToken: randomUUID(),
      tokenCreatedAt: nowIso(),
      tokenRevokedAt: null,
      tokenLastUsedAt: null,
      source: attribution.source,
      attribution,
      ...pilot,
      createdAt: nowIso()
    };
    const elder = {
      id: id('elder'),
      familyId: family.id,
      name: elderName,
      whatsappPhone: elderPhone,
      dailyCheckTime,
      timezone: input.timezone || 'Asia/Jerusalem',
      language: pilot.language,
      country: pilot.country,
      shomerShabbat: checkbox(input, 'shomerShabbat'),
      noResponseGraceMinutes: alertDelayMinutes(input),
      noResponseAlertRepeatCount: alertRepeatCount(input),
      optInStatus: optInBypass.elder ? 'approved' : 'pending',
      optInRequestedAt: optInBypass.elder ? null : nowIso(),
      optInAcceptedAt: optInBypass.elder ? nowIso() : null,
      optInVersion: legalVersions.whatsappOptIn,
      active: true,
      createdAt: nowIso()
    };
    const contact = {
      id: id('contact'),
      elderId: elder.id,
      name: contactName,
      whatsappPhone: contactPhone,
      relationship: input.relationship || 'קרוב משפחה',
      language: pilot.language,
      optInStatus: optInBypass.contact ? 'approved' : 'pending',
      optInRequestedAt: optInBypass.contact ? null : nowIso(),
      optInAcceptedAt: optInBypass.contact ? nowIso() : null,
      optInVersion: legalVersions.whatsappOptIn,
      createdAt: nowIso()
    };

    db.families.push(family);
    db.elders.push(elder);
    db.contacts.push(contact);
    db.audit.push({ id: id('evt'), type: 'family_created', payload: { familyId: family.id, elderId: elder.id, attribution }, createdAt: nowIso() });

    return { family, elder, contact };
  });

  if (created.waitlist) return created;

  const warnings = [];
  if (!optInBypass.elder) {
    try { await sendOptIn(created.elder, created.family); }
    catch (err) { warnings.push(`שליחת אישור להורה נכשלה: ${err.message}`); await recordSendFailure('optin', created.elder.whatsappPhone, err, { elderId: created.elder.id }); }
  }
  if (!optInBypass.contact) {
    try { await sendContactOptIn(created.contact, created.elder, created.family); }
    catch (err) { warnings.push(`שליחת אישור לבן/בת המשפחה נכשלה: ${err.message}`); await recordSendFailure('contact_optin', created.contact.whatsappPhone, err, { elderId: created.elder.id, contactId: created.contact.id }); }
  }
  if (warnings.length) created.warnings = warnings;

  return created;
}

export async function addContactByToken(token, elderId, input) {
  const name = requireField(input, 'contactName');
  const phone = normalizePhone(requireField(input, 'contactPhone'));
  const created = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    const existing = db.contacts.find((c) => c.elderId === elderId && normalizePhone(c.whatsappPhone) === phone);
    if (existing) throw new Error('איש קשר עם מספר WhatsApp זה כבר קיים עבור האדם הזה');
    const inheritedApproval = approvedSameFamilyContact(db, family.id, phone);
    const contact = { id: id('contact'), elderId, name, whatsappPhone: phone, relationship: input.relationship || (family.language === 'en_US' ? 'Family member' : 'קרוב משפחה'), language: elder.language || family.language || 'he', optInStatus: inheritedApproval ? 'approved' : 'pending', createdAt: nowIso() };
    db.contacts.push(contact);
    db.audit.push({ id: id('evt'), type: 'contact_added', payload: { elderId, contactId: contact.id, inheritedApprovalFromContactId: inheritedApproval?.id || null }, createdAt: nowIso() });
    return { contact: { ...contact }, elder: { ...elder }, family: { ...family } };
  });
  if (created.contact.optInStatus !== 'approved') await sendContactOptIn(created.contact, created.elder, created.family);
  return created.contact;
}

export async function addElderByToken(token, input = {}, options = {}) {
  if (!input.elderConsent) throw new Error('צריך לאשר שהאדם יודע/יקבל הסבר ושהשירות יופעל רק לאחר אישור WhatsApp שלו/ה');
  const optInBypass = trustedOptInBypass(input, options);
  const elderName = requireField(input, 'elderName');
  const elderPhone = normalizePhone(requireField(input, 'elderPhone'));
  const dailyCheckTime = requireField(input, 'dailyCheckTime');
  if (!isValidTime(dailyCheckTime)) throw new Error('שעה לא תקינה');
  const created = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family || family.tokenRevokedAt) throw new Error('Family not found');
    const contactName = String(input.contactName || family.ownerName).trim();
    const contactPhone = normalizePhone(input.contactPhone || family.ownerPhone);
    const elder = {
      id: id('elder'),
      familyId: family.id,
      name: elderName,
      whatsappPhone: elderPhone,
      dailyCheckTime,
      timezone: input.timezone || 'Asia/Jerusalem',
      language: family.language || 'he',
      country: family.country || 'IL',
      shomerShabbat: checkbox(input, 'shomerShabbat'),
      noResponseGraceMinutes: alertDelayMinutes(input),
      noResponseAlertRepeatCount: alertRepeatCount(input),
      optInStatus: optInBypass.elder ? 'approved' : 'pending',
      active: true,
      createdAt: nowIso()
    };
    const inheritedApproval = approvedSameFamilyContact(db, family.id, contactPhone);
    const contact = {
      id: id('contact'),
      elderId: elder.id,
      name: contactName,
      whatsappPhone: contactPhone,
      relationship: input.relationship || 'קרוב משפחה',
      language: family.language || 'he',
      optInStatus: optInBypass.contact || inheritedApproval ? 'approved' : 'pending',
      createdAt: nowIso()
    };
    db.elders.push(elder);
    db.contacts.push(contact);
    db.audit.push({ id: id('evt'), type: 'elder_added', payload: { familyId: family.id, elderId: elder.id, contactId: contact.id, inheritedContactApprovalFromContactId: inheritedApproval?.id || null }, createdAt: nowIso() });
    return { family: { ...family }, elder: { ...elder }, contact: { ...contact } };
  });
  const warnings = [];
  if (!optInBypass.elder) {
    try { await sendOptIn(created.elder, created.family); }
    catch (err) { warnings.push(`שליחת אישור להורה נכשלה: ${err.message}`); await recordSendFailure('optin', created.elder.whatsappPhone, err, { elderId: created.elder.id }); }
  }
  if (!optInBypass.contact && created.contact.optInStatus !== 'approved') {
    try { await sendContactOptIn(created.contact, created.elder, created.family); }
    catch (err) { warnings.push(`שליחת אישור לבן/בת המשפחה נכשלה: ${err.message}`); await recordSendFailure('contact_optin', created.contact.whatsappPhone, err, { elderId: created.elder.id, contactId: created.contact.id }); }
  }
  if (warnings.length) created.warnings = warnings;
  return created;
}

export async function deleteContactByToken(token, contactId) {
  const result = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elderIds = db.elders.filter((e) => e.familyId === family.id).map((e) => e.id);
    const contact = db.contacts.find((c) => c.id === contactId && elderIds.includes(c.elderId));
    if (!contact) throw new Error('Contact not found');
    db.contacts = db.contacts.filter((c) => c.id !== contactId);
    db.audit.push({ id: id('evt'), type: 'contact_deleted', payload: { contactId }, createdAt: nowIso() });
    return { deleted: true };
  });
  return result;
}

export async function getOutboundMessagesByToken(token, elderId = null) {
  const db = await loadDb();
  const family = db.families.find((f) => f.managementToken === token);
  if (!family || family.tokenRevokedAt) throw new Error('Family not found');
  family.tokenLastUsedAt = nowIso();
  await saveDb(db);
  const elderIds = db.elders.filter((e) => e.familyId === family.id).map((e) => e.id);
  const allowed = new Set(elderId ? [elderId] : elderIds);
  return db.outboundMessages
    .filter((m) => !m.meta?.elderId || allowed.has(m.meta.elderId))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 50);
}

export async function betaStatus(cohort = '') {
  const db = await loadDb();
  if (cohort === 'uk_free_2026') {
    const used = db.families.filter((family) => family.pilotCohort === cohort).length;
    const waitlist = (db.waitlist || []).filter((entry) => entry.pilotCohort === cohort).length;
    return {
      open: config.betaOpen && used < config.ukPilotMaxFamilies && db.families.length < config.betaMaxFamilies,
      cohort,
      maxFamilies: config.ukPilotMaxFamilies,
      used,
      remaining: Math.max(0, config.ukPilotMaxFamilies - used),
      waitlist
    };
  }
  return {
    open: config.betaOpen && db.families.length < config.betaMaxFamilies,
    maxFamilies: config.betaMaxFamilies,
    used: db.families.length,
    remaining: Math.max(0, config.betaMaxFamilies - db.families.length),
    waitlist: (db.waitlist || []).length
  };
}

export async function waitlistReport() {
  const db = await loadDb();
  return (db.waitlist || []).slice().reverse();
}

function messageStatusLabel(status = '') {
  const labels = {
    failed: 'נכשל',
    ignored: 'נקלט בלי שיוך',
    sent: 'נשלח ל־WhatsApp',
    delivered: 'נמסר לנמען',
    read: 'נקרא',
    opt_in_approved: 'אישור התקבל',
    opt_in_declined: 'אישור נדחה',
    contact_opt_in_approved: 'אישור איש קשר התקבל',
    contact_opt_in_declined: 'אישור איש קשר נדחה',
    owner_opt_in_approved: 'אישור בעל חשבון התקבל',
    owner_opt_in_declined: 'אישור בעל חשבון נדחה',
    response_recorded: 'תגובה נשמרה',
    website_lead_ack_sent: 'מענה אוטומטי נשלח'
  };
  return labels[status] || status || 'לא ידוע';
}

export async function adminSimpleOverview() {
  const db = await loadDb();
  const families = db.families
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((family) => {
      const elders = db.elders.filter((elder) => elder.familyId === family.id);
      const contacts = db.contacts.filter((contact) => elders.some((elder) => elder.id === contact.elderId));
      const elderIds = new Set(elders.map((elder) => elder.id));
      const messagesSent = db.outboundMessages.filter((message) => !message.meta?.elderId || elderIds.has(message.meta.elderId));
      const failedMessages = messagesSent.filter((message) => message.status === 'failed');
      return {
        id: family.id,
        name: family.ownerName || 'ללא שם',
        phone: maskPhone(family.ownerPhone),
        email: family.ownerEmail || '',
        createdAt: family.createdAt,
        elders: elders.map((elder) => ({ name: elder.name, phone: maskPhone(elder.whatsappPhone), optInStatus: elder.optInStatus, active: elder.active, dailyCheckTime: elder.dailyCheckTime })),
        contacts: contacts.map((contact) => ({ name: contact.name, phone: maskPhone(contact.whatsappPhone), optInStatus: contact.optInStatus, relationship: contact.relationship })),
        counts: { elders: elders.length, contacts: contacts.length, sent: messagesSent.length, failed: failedMessages.length }
      };
    });
  const inbound = (db.inboundMessages || [])
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 30)
    .map((message) => ({
      createdAt: message.createdAt,
      from: maskPhone(message.from),
      content: message.buttonTitle || message.text || '(ריק)',
      type: message.type,
      status: messageStatusLabel(message.status),
      rawStatus: message.status,
      mapped: message.mapped || ''
    }));
  const outbound = (db.outboundMessages || [])
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 30)
    .map((message) => ({
      createdAt: message.createdAt,
      to: maskPhone(message.to),
      kind: message.kind,
      status: messageStatusLabel(message.status || 'sent'),
      rawStatus: message.status || 'sent',
      body: String(message.body || '').slice(0, 180),
      error: message.error || ''
    }));
  const templatePlan = [
    { name: 'contact_optin_he', purpose: 'אישור הצטרפות לשירות / איש קשר', required: true },
    { name: 'daily_check_he', purpose: 'בדיקת בוקר יומית', required: true },
    { name: 'incomplete_signup_reminder_he', purpose: 'תזכורת למי שהתחיל הרשמה ולא השלים פרטים', required: true },
    { name: 'no_response_alert_he', purpose: 'עדכון משפחה כשאין מענה', required: true },
    { name: 'family_greeting_message_he', purpose: 'ד״ש למשפחה — אופציונלי, אפשר לדחות', required: false },
    { name: 'family_connection_update_he', purpose: 'עדכון כללי למשפחה — אופציונלי', required: false },
    { name: 'daily_warm_connection_he', purpose: 'נוסח חלופי לבדיקה — אופציונלי', required: false }
  ];
  return {
    summary: {
      families: families.length,
      elders: db.elders.length,
      contacts: db.contacts.length,
      inbound: (db.inboundMessages || []).length,
      outbound: (db.outboundMessages || []).length,
      failedOutbound: (db.outboundMessages || []).filter((message) => message.status === 'failed').length,
      pendingOptIns: db.elders.filter((elder) => elder.optInStatus === 'pending').length + db.contacts.filter((contact) => contact.optInStatus === 'pending').length,
      declinedOptIns: db.elders.filter((elder) => elder.optInStatus === 'declined').length + db.contacts.filter((contact) => contact.optInStatus === 'declined').length
    },
    families,
    inbound,
    outbound,
    templatePlan
  };
}

export async function betaUpdateCandidates({ hours = 24, includeTests = false } = {}) {
  const db = await loadDb();
  const sinceMs = Date.now() - Number(hours || 24) * 60 * 60 * 1000;
  const inbound = (db.inboundMessages || []).filter((message) => new Date(message.createdAt || Number(message.timestamp || 0) * 1000 || 0).getTime() >= sinceMs);
  const inboundPhones = inbound.map((message) => normalizeDigits(message.from)).filter(Boolean);
  const candidates = [];
  const seen = new Set();

  for (const family of db.families || []) {
    const elders = (db.elders || []).filter((elder) => elder.familyId === family.id);
    const contacts = (db.contacts || []).filter((contact) => elders.some((elder) => elder.id === contact.elderId));
    const isTest = isTestFamilyRecord(family, elders, contacts);
    if (isTest && !includeTests) continue;
    for (const contact of contacts) {
      if (contact.optInStatus !== 'approved') continue;
      const elder = elders.find((item) => item.id === contact.elderId);
      if (!elder || elder.optInStatus !== 'approved') continue;
      const phone = normalizeDigits(contact.whatsappPhone);
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      const inWindow = inboundPhones.some((from) => samePhone(from, phone));
      candidates.push({
        maskedPhone: maskPhone(contact.whatsappPhone),
        contactId: contact.id,
        elderId: elder.id,
        familyId: family.id,
        familyName: family.ownerName || '',
        contactName: contact.name || '',
        elderName: elder.name || '',
        dailyCheckTime: elder.dailyCheckTime,
        in24hWindow: inWindow,
        eligible: inWindow,
        isTest
      });
    }
  }

  candidates.sort((a, b) => String(a.familyName).localeCompare(String(b.familyName), 'he'));
  return { hours: Number(hours || 24), checkedAt: nowIso(), totalContacts: candidates.length, eligibleCount: candidates.filter((candidate) => candidate.eligible).length, candidates };
}

export async function sendBetaUpdateToRecentContacts({ message, hours = 24, includeTests = false, dryRun = true } = {}) {
  const db = await loadDb();
  const sinceMs = Date.now() - Number(hours || 24) * 60 * 60 * 1000;
  const inbound = (db.inboundMessages || []).filter((item) => new Date(item.createdAt || Number(item.timestamp || 0) * 1000 || 0).getTime() >= sinceMs);
  const inboundPhones = inbound.map((item) => normalizeDigits(item.from)).filter(Boolean);
  const body = String(message || '').trim();
  if (!body) throw new Error('Missing beta update message');
  const targets = [];
  const seen = new Set();

  for (const family of db.families || []) {
    const elders = (db.elders || []).filter((elder) => elder.familyId === family.id);
    const contacts = (db.contacts || []).filter((contact) => elders.some((elder) => elder.id === contact.elderId));
    if (isTestFamilyRecord(family, elders, contacts) && !includeTests) continue;
    for (const contact of contacts) {
      if (contact.optInStatus !== 'approved') continue;
      const elder = elders.find((item) => item.id === contact.elderId);
      if (!elder || elder.optInStatus !== 'approved') continue;
      const phone = normalizeDigits(contact.whatsappPhone);
      if (!phone || seen.has(phone)) continue;
      if (!inboundPhones.some((from) => samePhone(from, phone))) continue;
      seen.add(phone);
      targets.push({ family, elder, contact });
    }
  }

  const sent = [];
  if (!dryRun) {
    for (const target of targets) {
      const outbound = await sendBetaUpdate(target.contact.whatsappPhone, body, { familyId: target.family.id, elderId: target.elder.id, contactId: target.contact.id, hours: Number(hours || 24) });
      sent.push({ maskedPhone: maskPhone(target.contact.whatsappPhone), familyId: target.family.id, elderId: target.elder.id, contactId: target.contact.id, messageId: outbound.id });
    }
    await audit('beta_update_sent', { count: sent.length, hours: Number(hours || 24) });
  }

  return {
    dryRun: Boolean(dryRun),
    eligibleCount: targets.length,
    sentCount: sent.length,
    targets: targets.map((target) => ({ maskedPhone: maskPhone(target.contact.whatsappPhone), familyId: target.family.id, elderId: target.elder.id, contactId: target.contact.id })),
    sent
  };
}

function incompleteSignupTargets(db, { familyId = '', phoneLast4 = '', ownerEmail = '', includeTests = false } = {}) {
  const last4 = normalizeDigits(phoneLast4).slice(-4);
  const email = cleanEmail(ownerEmail);
  const targets = [];
  for (const family of db.families || []) {
    if (familyId && family.id !== familyId) continue;
    if (email && cleanEmail(family.ownerEmail) !== email) continue;
    if (last4 && !normalizeDigits(family.ownerPhone).endsWith(last4)) continue;
    const elders = (db.elders || []).filter((elder) => elder.familyId === family.id);
    const contacts = (db.contacts || []).filter((contact) => elders.some((elder) => elder.id === contact.elderId));
    const isTest = isTestFamilyRecord(family, elders, contacts);
    if (isTest && !includeTests) continue;
    const missingElders = elders.length === 0;
    const missingContacts = contacts.length === 0;
    if (!missingElders && !missingContacts) continue;
    targets.push({ family, missing: { elders: missingElders, contacts: missingContacts }, isTest });
  }
  return targets;
}

export async function incompleteSignupReminderCandidates({ familyId = '', phoneLast4 = '', ownerEmail = '', includeTests = false } = {}) {
  const db = await loadDb();
  const targets = incompleteSignupTargets(db, { familyId, phoneLast4, ownerEmail, includeTests });
  return {
    checkedAt: nowIso(),
    eligibleCount: targets.length,
    targets: targets.map(({ family, missing, isTest }) => ({
      familyId: family.id,
      name: family.ownerName || '',
      email: family.ownerEmail || '',
      maskedPhone: maskPhone(family.ownerPhone),
      missing,
      isTest
    }))
  };
}

export async function sendIncompleteSignupReminders({ familyId = '', phoneLast4 = '', ownerEmail = '', includeTests = false, dryRun = true, signupUrl = '' } = {}) {
  const db = await loadDb();
  const targets = incompleteSignupTargets(db, { familyId, phoneLast4, ownerEmail, includeTests });
  if ((familyId || phoneLast4 || ownerEmail) && targets.length !== 1) throw new Error(`Expected exactly one incomplete signup target, found ${targets.length}`);

  const sent = [];
  if (!dryRun) {
    for (const target of targets) {
      const outbound = await sendIncompleteSignupReminder(target.family, { signupUrl });
      sent.push({ familyId: target.family.id, maskedPhone: maskPhone(target.family.ownerPhone), messageId: outbound.id });
    }
    await audit('incomplete_signup_reminder_sent', { count: sent.length, targeted: Boolean(familyId || phoneLast4 || ownerEmail) });
  }

  return {
    dryRun: Boolean(dryRun),
    eligibleCount: targets.length,
    sentCount: sent.length,
    targets: targets.map(({ family, missing, isTest }) => ({ familyId: family.id, name: family.ownerName || '', email: family.ownerEmail || '', maskedPhone: maskPhone(family.ownerPhone), missing, isTest })),
    sent
  };
}

export async function normalizeFamilyContactOptIns({ familyId = '', ownerEmail = '', phoneLast4 = '', dryRun = true } = {}) {
  const db = await loadDb();
  const email = cleanEmail(ownerEmail);
  const last4 = normalizeDigits(phoneLast4).slice(-4);
  const families = (db.families || [])
    .filter((family) => !familyId || family.id === familyId)
    .filter((family) => !email || cleanEmail(family.ownerEmail) === email)
    .filter((family) => !last4 || normalizeDigits(family.ownerPhone).endsWith(last4));
  if ((familyId || ownerEmail || phoneLast4) && families.length !== 1) throw new Error(`Expected exactly one family, found ${families.length}`);

  const changes = [];
  const apply = (targetDb) => {
    for (const family of families) {
      const contacts = familyContacts(targetDb, family.id);
      const approvedByPhone = new Map();
      for (const contact of contacts) {
        const phone = normalizePhone(contact.whatsappPhone);
        if (phone && contact.optInStatus === 'approved') approvedByPhone.set(phone, contact);
      }
      for (const contact of contacts) {
        const phone = normalizePhone(contact.whatsappPhone);
        const approved = approvedByPhone.get(phone);
        if (!approved || approved.id === contact.id || contact.optInStatus === 'approved') continue;
        changes.push({ familyId: family.id, contactId: contact.id, inheritedFromContactId: approved.id, previousStatus: contact.optInStatus, phone: maskPhone(contact.whatsappPhone) });
        if (!dryRun) contact.optInStatus = 'approved';
      }
    }
    if (!dryRun && changes.length) {
      targetDb.audit.push({ id: id('evt'), type: 'family_contact_opt_ins_normalized', payload: { count: changes.length, changes }, createdAt: nowIso() });
    }
    return { dryRun: Boolean(dryRun), changedCount: changes.length, changes };
  };

  if (dryRun) return apply(db);
  return mutateDb(apply);
}

export async function sendBetaUpdateToRecentContact({ contactId = '', phoneLast4 = '', message, hours = 24, includeTests = false, dryRun = true } = {}) {
  const db = await loadDb();
  const sinceMs = Date.now() - Number(hours || 24) * 60 * 60 * 1000;
  const inbound = (db.inboundMessages || []).filter((item) => new Date(item.createdAt || Number(item.timestamp || 0) * 1000 || 0).getTime() >= sinceMs);
  const inboundPhones = inbound.map((item) => normalizeDigits(item.from)).filter(Boolean);
  const body = String(message || '').trim();
  if (!body) throw new Error('Missing beta update message');
  const last4 = normalizeDigits(phoneLast4).slice(-4);

  let selected = null;
  for (const family of db.families || []) {
    const elders = (db.elders || []).filter((elder) => elder.familyId === family.id);
    const contacts = (db.contacts || []).filter((contact) => elders.some((elder) => elder.id === contact.elderId));
    if (isTestFamilyRecord(family, elders, contacts) && !includeTests) continue;
    for (const contact of contacts) {
      if (contactId && contact.id !== contactId) continue;
      if (last4 && !normalizeDigits(contact.whatsappPhone).endsWith(last4)) continue;
      const elder = elders.find((item) => item.id === contact.elderId);
      if (!elder) continue;
      selected = { family, elder, contact };
      break;
    }
    if (selected) break;
  }

  if (!selected) throw new Error('Contact not found');
  if (selected.contact.optInStatus !== 'approved') throw new Error('Contact is not approved');
  if (selected.elder.optInStatus !== 'approved' && !includeTests) throw new Error('Elder is not approved');
  const phone = normalizeDigits(selected.contact.whatsappPhone);
  const inWindow = inboundPhones.some((from) => samePhone(from, phone));
  if (!inWindow) throw new Error('Contact is outside 24h WhatsApp window');

  if (dryRun) {
    return { dryRun: true, eligible: true, maskedPhone: maskPhone(selected.contact.whatsappPhone), familyId: selected.family.id, elderId: selected.elder.id, contactId: selected.contact.id };
  }

  const outbound = await sendBetaUpdate(selected.contact.whatsappPhone, body, { familyId: selected.family.id, elderId: selected.elder.id, contactId: selected.contact.id, hours: Number(hours || 24), targeted: true });
  await audit('beta_update_targeted_sent', { contactId: selected.contact.id, elderId: selected.elder.id, familyId: selected.family.id, hours: Number(hours || 24) });
  return { dryRun: false, sent: true, maskedPhone: maskPhone(selected.contact.whatsappPhone), familyId: selected.family.id, elderId: selected.elder.id, contactId: selected.contact.id, messageId: outbound.id };
}

export async function sendReplyToRecentInbound({ inboundId = '', phoneLast4 = '', message, hours = 24, dryRun = true } = {}) {
  const db = await loadDb();
  const body = String(message || '').trim();
  if (!body) throw new Error('Missing reply message');
  const last4 = normalizeDigits(phoneLast4).slice(-4);
  if (!inboundId && (!last4 || last4.length < 4)) throw new Error('Missing inboundId or phoneLast4');

  const sinceMs = Date.now() - Number(hours || 24) * 60 * 60 * 1000;
  const matches = (db.inboundMessages || [])
    .filter((item) => new Date(item.createdAt || Number(item.timestamp || 0) * 1000 || 0).getTime() >= sinceMs)
    .filter((item) => inboundId ? item.id === inboundId : normalizeDigits(item.from).endsWith(last4))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (!matches.length) throw new Error('Recent inbound sender not found');
  const selected = matches[0];
  const to = normalizeDigits(selected.from);
  if (!to) throw new Error('Inbound sender has no phone');

  if (dryRun) {
    return { dryRun: true, eligible: true, to: maskPhone(to), inboundId: selected.id, inboundCreatedAt: selected.createdAt };
  }

  const outbound = await sendBetaUpdate(to, body, { inboundId: selected.id, hours: Number(hours || 24), targetedInboundReply: true });
  await audit('inbound_reply_sent', { inboundId: selected.id, to: maskPhone(to), hours: Number(hours || 24), messageId: outbound.id });
  return { dryRun: false, sent: true, to: maskPhone(to), inboundId: selected.id, messageId: outbound.id };
}

export async function acknowledgeWebsiteLead({ from = '', inboundMessageId = '', inboundText = '' } = {}) {
  if (!config.websiteLeadAutoReplyEnabled) return { sent: false, reason: 'disabled' };
  const matchText = String(config.websiteLeadMatchText || '').trim();
  if (!matchText || !String(inboundText || '').includes(matchText)) return { sent: false, reason: 'not_website_lead' };

  const db = await loadDb();
  const duplicate = (db.outboundMessages || []).find((item) =>
    item.kind === 'website_lead_auto_reply' && item.meta?.inboundMessageId === inboundMessageId
  );
  if (duplicate) return { sent: false, reason: 'already_acknowledged', messageId: duplicate.id };

  const to = normalizeDigits(from);
  if (!to) throw new Error('Website lead sender has no phone');
  const outbound = await sendWebsiteLeadAutoReply(to, config.websiteLeadAutoReplyText, {
    inboundMessageId,
    source: 'website_whatsapp_link'
  });
  await audit('website_lead_auto_reply_sent', { inboundMessageId, to: maskPhone(to), messageId: outbound.id });
  return { sent: true, messageId: outbound.id };
}

export async function adminConversations({ limit = 50 } = {}) {
  const db = await loadDb();
  const normalize = (value) => normalizeDigits(value);
  const inbound = (db.inboundMessages || [])
    .filter((message) => normalize(message.from))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const outbound = (db.outboundMessages || [])
    .filter((message) => normalize(message.to))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const byPhone = new Map();

  for (const message of inbound) {
    const phone = normalize(message.from);
    if (!byPhone.has(phone)) byPhone.set(phone, { phone, inbound: [], outbound: [] });
    byPhone.get(phone).inbound.push(message);
  }
  for (const message of outbound) {
    const phone = normalize(message.to);
    if (!byPhone.has(phone)) continue;
    byPhone.get(phone).outbound.push(message);
  }

  const now = Date.now();
  return Array.from(byPhone.values())
    .map((thread) => {
      const latestInbound = thread.inbound[thread.inbound.length - 1];
      const latestAt = latestInbound?.createdAt || '';
      const latestMs = new Date(latestAt).getTime();
      const messages = [
        ...thread.inbound.map((message) => ({
          id: message.id,
          direction: 'inbound',
          type: message.type,
          content: message.text || message.buttonTitle || '(הודעה ללא טקסט)',
          status: messageStatusLabel(message.status),
          createdAt: message.createdAt
        })),
        ...thread.outbound.map((message) => ({
          id: message.id,
          direction: 'outbound',
          type: message.kind,
          content: message.body || '',
          status: messageStatusLabel(message.status || 'sent'),
          createdAt: message.createdAt
        }))
      ].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      return {
        phone: thread.phone,
        maskedPhone: maskPhone(thread.phone),
        latestInboundId: latestInbound?.id || '',
        latestAt,
        latestText: latestInbound?.text || latestInbound?.buttonTitle || '',
        websiteLead: thread.inbound.some((message) => String(message.text || '').includes(config.websiteLeadMatchText)),
        replyWindowOpen: Number.isFinite(latestMs) && now - latestMs <= 24 * 60 * 60 * 1000,
        messages
      };
    })
    .sort((a, b) => String(b.latestAt).localeCompare(String(a.latestAt)))
    .slice(0, Math.min(Math.max(Number(limit) || 50, 1), 100));
}

export async function sourceReport() {
  const db = await loadDb();
  const report = {};
  for (const family of db.families) {
    const source = family.source || 'direct';
    report[source] = report[source] || { source, families: 0, elders: 0, activeElders: 0 };
    report[source].families += 1;
    const elders = db.elders.filter((e) => e.familyId === family.id);
    report[source].elders += elders.length;
    report[source].activeElders += elders.filter((e) => e.active).length;
  }
  return Object.values(report).sort((a, b) => b.families - a.families);
}

export async function systemReadiness() {
  const db = await loadDb();
  const activeElders = db.elders.filter((e) => e.active).length;
  const pendingOptIns = db.elders.filter((e) => e.optInStatus === 'pending').length;
  const pendingContactOptIns = db.contacts.filter((c) => c.optInStatus === 'pending').length;
  const openChecks = db.checks.filter((c) => c.status === 'sent').length;
  const failedChecks = db.checks.filter((c) => c.status === 'failed').length;
  const latestAudit = db.audit.slice(-10).reverse();
  return {
    ok: true,
    counts: {
      families: db.families.length,
      elders: db.elders.length,
      activeElders,
      pendingOptIns,
      pendingContactOptIns,
      openChecks,
      failedChecks,
      outboundMessages: db.outboundMessages.length,
      auditEvents: db.audit.length
    },
    readiness: {
      hasFamilies: db.families.length > 0,
      hasActiveElders: activeElders > 0,
      noOpenFailures: failedChecks === 0,
      note: 'Meta readiness also requires environment variables, approved templates, HTTPS webhook, and real WhatsApp Business number.'
    },
    latestAudit
  };
}

export async function getCheckHistoryByToken(token, elderId) {
  const db = await loadDb();
  const family = db.families.find((f) => f.managementToken === token);
  if (!family || family.tokenRevokedAt) throw new Error('Family not found');
  family.tokenLastUsedAt = nowIso();
  await saveDb(db);
  const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
  if (!elder) throw new Error('Elder not found');
  return db.checks
    .filter((c) => c.elderId === elderId)
    .sort((a, b) => String(b.sentAt || b.scheduledAt).localeCompare(String(a.sentAt || a.scheduledAt)))
    .slice(0, 30);
}

export async function regenerateFamilyToken(oldToken) {
  const result = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === oldToken);
    if (!family || family.tokenRevokedAt) throw new Error('Family not found');
    family.managementToken = randomUUID();
    family.tokenCreatedAt = nowIso();
    family.tokenRevokedAt = null;
    family.tokenLastUsedAt = null;
    db.audit.push({ id: id('evt'), type: 'family_token_regenerated', payload: { familyId: family.id }, createdAt: nowIso() });
    return { managementToken: family.managementToken };
  });
  return result;
}

export async function revokeFamilyToken(token) {
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    family.tokenRevokedAt = nowIso();
    db.audit.push({ id: id('evt'), type: 'family_token_revoked', payload: { familyId: family.id }, createdAt: nowIso() });
    return { revoked: true };
  });
}

export async function deleteFamilyByToken(token) {
  const current = await loadDb();
  const family = current.families.find((item) => item.managementToken === token);
  if (!family) throw new Error('Family not found');
  const elders = current.elders.filter((item) => item.familyId === family.id);
  const elderIds = new Set(elders.map((item) => item.id));
  const contacts = current.contacts.filter((item) => elderIds.has(item.elderId));
  const contactIds = new Set(contacts.map((item) => item.id));
  const phoneKey = (value) => String(value || '').replace(/\D/g, '').replace(/^0/, '972');
  const phones = new Set([family.ownerPhone, ...elders.map((item) => item.whatsappPhone), ...contacts.map((item) => item.whatsappPhone)].map(phoneKey).filter(Boolean));
  await deleteFirebaseAuthUser(family.firebaseAuthUid);
  const receiptId = id('deletion');
  const result = await mutateDb((db) => {
    const relatedId = (payload = {}) => payload.familyId === family.id || elderIds.has(payload.elderId) || contactIds.has(payload.contactId);
    const relatedMessage = (message = {}) => relatedId(message.meta || {}) || phones.has(phoneKey(message.to)) || phones.has(phoneKey(message.from));
    db.families = db.families.filter((item) => item.id !== family.id);
    db.elders = db.elders.filter((item) => item.familyId !== family.id && !elderIds.has(item.id));
    db.contacts = db.contacts.filter((item) => !elderIds.has(item.elderId) && !contactIds.has(item.id));
    db.checks = db.checks.filter((item) => !elderIds.has(item.elderId));
    db.inboundMessages = (db.inboundMessages || []).filter((item) => !relatedMessage(item));
    db.outboundMessages = (db.outboundMessages || []).filter((item) => !relatedMessage(item));
    db.feedback = (db.feedback || []).filter((item) => item.family?.familyId !== family.id && item.familyId !== family.id);
    db.errors = (db.errors || []).filter((item) => !relatedId(item.context || {}) && !relatedId(item.payload || {}));
    db.waitlist = (db.waitlist || []).filter((item) => String(item.ownerEmail || '').toLowerCase() !== String(family.ownerEmail || '').toLowerCase() && !phones.has(phoneKey(item.ownerPhone)));
    db.audit = (db.audit || []).filter((item) => !relatedId(item.payload || {}));
    db.audit.push({ id: id('evt'), type: 'account_deletion_completed', payload: { receiptId }, createdAt: nowIso() });
    return { deleted: true, receiptId };
  });
  await purgeFamilyFromBackups({ familyId: family.id, elderIds, contactIds, phones, ownerEmail: family.ownerEmail });
  return result;
}

export async function optOutByPhone(phone) {
  const normalized = String(phone || '').replace(/[^0-9]/g, '');
  return mutateDb((db) => {
    const elder = db.elders.find((e) => String(e.whatsappPhone || '').replace(/[^0-9]/g, '').endsWith(normalized) || normalized.endsWith(String(e.whatsappPhone || '').replace(/[^0-9]/g, '')));
    if (!elder) return { found: false };
    elder.active = false;
    elder.optInStatus = 'declined';
    db.audit.push({ id: id('evt'), type: 'whatsapp_opt_out', payload: { elderId: elder.id, phone }, createdAt: nowIso() });
    return { found: true, elder: { ...elder } };
  });
}

export async function exportFamiliesCsv() {
  const db = await loadDb();
  const rows = [['family_id','source','ref','utm_source','utm_medium','utm_campaign','utm_content','utm_term','owner_name','owner_phone','owner_email','elder_name','elder_phone','daily_check_time','opt_in_status','active','contact_name','contact_phone','latest_status','created_at']];
  for (const family of db.families) {
    const elders = db.elders.filter((e) => e.familyId === family.id);
    for (const elder of elders) {
      const contact = db.contacts.find((c) => c.elderId === elder.id) || {};
      const latest = db.checks.filter((c) => c.elderId === elder.id).sort((a,b)=>String(b.sentAt||'').localeCompare(String(a.sentAt||'')))[0] || {};
      const attr = family.attribution || {};
      rows.push([family.id, family.source || attr.source || 'direct', attr.ref || '', attr.utm_source || '', attr.utm_medium || '', attr.utm_campaign || '', attr.utm_content || '', attr.utm_term || '', family.ownerName, family.ownerPhone, family.ownerEmail || '', elder.name, elder.whatsappPhone, elder.dailyCheckTime, elder.optInStatus, elder.active, contact.name || '', contact.whatsappPhone || '', latest.status || '', family.createdAt]);
    }
  }
  return rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

export async function getFamilyByToken(token) {
  if (!token) throw new Error('Missing token');
  const db = await loadDb();
  const family = db.families.find((f) => f.managementToken === token);
  if (!family || family.tokenRevokedAt) throw new Error('Family not found');
  family.tokenLastUsedAt = nowIso();
  await saveDb(db);
  const elders = db.elders.filter((e) => e.familyId === family.id).map((elder) => {
    const contact = db.contacts.find((c) => c.elderId === elder.id);
    const contacts = db.contacts.filter((c) => c.elderId === elder.id);
    const latestCheck = db.checks.filter((c) => c.elderId === elder.id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0] || null;
    return { ...elder, contact, contacts, latestCheck };
  });
  const { passwordHash: _passwordHash, managementToken: _managementToken, firebaseAuthUid: _firebaseAuthUid, ...safeFamily } = family;
  return { ...safeFamily, elders };
}

export async function loginFamily({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) throw new Error('חסר מייל או סיסמה');
  const db = await loadDb();
  const family = db.families.find((f) => String(f.ownerEmail || '').trim().toLowerCase() === normalizedEmail && !f.tokenRevokedAt);
  if (!family || !family.passwordHash || !verifyPassword(password, family.passwordHash)) throw new Error('מייל או סיסמה לא נכונים');
  family.tokenLastUsedAt = nowIso();
  await saveDb(db);
  return { managementToken: family.managementToken, familyId: family.id, ownerName: family.ownerName };
}

export async function setFamilyPasswordByToken(token, { email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('צריך להזין מייל תקין');
  if (cleanPassword.length < 8) throw new Error('הסיסמה צריכה לכלול לפחות 8 תווים');
  const result = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family || family.tokenRevokedAt) throw new Error('Family not found');
    const existing = db.families.find((f) => f.id !== family.id && String(f.ownerEmail || '').trim().toLowerCase() === normalizedEmail);
    if (existing) throw new Error('המייל כבר מחובר למשפחה אחרת');
    family.ownerEmail = normalizedEmail;
    family.passwordHash = hashPassword(cleanPassword);
    db.audit.push({ id: id('evt'), type: 'family_password_set', payload: { familyId: family.id }, createdAt: nowIso() });
    return { ok: true, ownerEmail: family.ownerEmail, firebaseAuthUid: family.firebaseAuthUid };
  });
  await updateFirebaseAuthUser(result.firebaseAuthUid, { email: result.ownerEmail, password: cleanPassword });
  return { ok: true, ownerEmail: result.ownerEmail };
}

export async function setMarketingConsentByEmail({ email, consent = false }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('צריך להזין מייל תקין');
  return mutateDb((db) => {
    const matches = db.families.filter((f) => String(f.ownerEmail || '').trim().toLowerCase() === normalizedEmail);
    for (const family of matches) {
      family.marketingEmailConsent = Boolean(consent);
      family.marketingEmailConsentAt = consent ? nowIso() : null;
      family.marketingEmailUnsubscribedAt = consent ? null : nowIso();
    }
    db.audit.push({ id: id('evt'), type: consent ? 'marketing_consent_enabled' : 'marketing_unsubscribed', payload: { email: normalizedEmail, count: matches.length }, createdAt: nowIso() });
    return { ok: true, email: normalizedEmail, updated: matches.length, marketingEmailConsent: Boolean(consent) };
  });
}

export async function updateElderByToken(token, elderId, updates) {
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    const contact = db.contacts.find((c) => c.elderId === elder.id);

    if (updates.elderName) elder.name = String(updates.elderName).trim();
    if (updates.elderPhone) elder.whatsappPhone = normalizePhone(updates.elderPhone);
    if (updates.dailyCheckTime) {
      if (!isValidTime(updates.dailyCheckTime)) throw new Error('שעה לא תקינה');
      elder.dailyCheckTime = String(updates.dailyCheckTime).trim();
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'shomerShabbat')) elder.shomerShabbat = checkbox(updates, 'shomerShabbat');
    if (updates.noResponseGraceMinutes || updates.alertDelayMinutes) elder.noResponseGraceMinutes = alertDelayMinutes(updates);
    if (updates.noResponseAlertRepeatCount || updates.alertRepeatCount) elder.noResponseAlertRepeatCount = alertRepeatCount(updates);
    if (updates.contactName && contact) contact.name = String(updates.contactName).trim();
    if (updates.contactPhone && contact) contact.whatsappPhone = normalizePhone(updates.contactPhone);

    db.audit.push({ id: id('evt'), type: 'elder_updated', payload: { elderId }, createdAt: nowIso() });
    return { elder: { ...elder }, contact: contact ? { ...contact } : null };
  });
}

export async function setElderActiveByToken(token, elderId, active) {
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    elder.active = Boolean(active);
    db.audit.push({ id: id('evt'), type: 'elder_active_changed', payload: { elderId, active: elder.active }, createdAt: nowIso() });
    return elder;
  });
}

export async function listDashboard() {
  const db = await loadDb();
  return db.families.map((family) => {
    const elders = db.elders.filter((e) => e.familyId === family.id).map((elder) => {
      const contact = db.contacts.find((c) => c.elderId === elder.id);
      const contacts = db.contacts.filter((c) => c.elderId === elder.id);
      const latestCheck = db.checks.filter((c) => c.elderId === elder.id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0] || null;
      return { ...elder, contact, contacts, latestCheck };
    });
    return { ...family, elders };
  });
}

export async function sendCheckNow(elderId, { source = 'manual', scheduledLocalDate = null } = {}) {
  const { elder, check } = await mutateDb((db) => {
    const elder = db.elders.find((e) => e.id === elderId);
    if (!elder) throw new Error('Elder not found');
    if (!elder.active) throw new Error('Elder is inactive');
    if (elder.optInStatus !== 'approved') throw new Error('Elder opt-in is not approved');
    const check = {
      id: id('check'),
      elderId: elder.id,
      scheduledAt: nowIso(),
      sentAt: nowIso(),
      status: 'sent',
      respondedAt: null,
      alertSentAt: null,
      noResponseAlertCount: 0,
      lastNoResponseAlertAt: null,
      noResponseReminderCount: 0,
      lastNoResponseReminderAt: null,
      source,
      scheduledLocalDate
    };
    db.checks.push(check);
    db.audit.push({ id: id('evt'), type: 'daily_check_sent', payload: { elderId, checkId: check.id }, createdAt: nowIso() });
    return { elder: { ...elder }, check: { ...check } };
  });
  try {
    await sendDailyCheck(elder, check);
  } catch (err) {
    await mutateDb((db) => {
      const failed = db.checks.find((c) => c.id === check.id);
      if (failed) {
        failed.status = 'failed';
        failed.error = err.message;
        failed.failedAt = nowIso();
      }
      db.audit.push({ id: id('evt'), type: 'daily_check_failed', payload: { elderId: elder.id, checkId: check.id, error: err.message }, createdAt: nowIso() });
    });
    throw err;
  }
  return check;
}

export async function markCheckFailed(checkId, err) {
  return mutateDb((db) => {
    const check = db.checks.find((c) => c.id === checkId);
    if (!check) throw new Error('Check not found');
    check.status = 'failed';
    check.error = err.message;
    check.failedAt = nowIso();
    db.audit.push({ id: id('evt'), type: 'daily_check_failed', payload: { checkId, error: err.message }, createdAt: nowIso() });
    return { ...check };
  });
}

export async function cancelOpenChecks({ elderId = '', checkId = '', reason = 'admin_cancelled' } = {}) {
  return mutateDb((db) => {
    const checks = db.checks.filter((check) => check.status === 'sent')
      .filter((check) => !elderId || check.elderId === elderId)
      .filter((check) => !checkId || check.id === checkId);
    const cancelledAt = nowIso();
    for (const check of checks) {
      check.status = 'cancelled';
      check.cancelledAt = cancelledAt;
      check.cancelReason = reason;
      db.audit.push({ id: id('evt'), type: 'daily_check_cancelled', payload: { checkId: check.id, elderId: check.elderId, reason }, createdAt: nowIso() });
    }
    return { cancelledCount: checks.length, checks: checks.map((check) => ({ ...check })) };
  });
}


export async function handleElderResponse({ elderId, checkId, response, inboundMessageId = '' }) {
  const result = await mutateDb((db) => {
    const elder = db.elders.find((e) => e.id === elderId);
    if (!elder) throw new Error('Elder not found');
    const check = checkId
      ? db.checks.find((c) => c.id === checkId)
      : db.checks.filter((c) => c.elderId === elderId && c.status === 'sent').sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
    if (!check) {
      db.audit.push({ id: id('evt'), type: 'late_or_duplicate_response_ignored', payload: { elderId, response }, createdAt: nowIso() });
      return { check: null, elder: { ...elder }, contact: null, action: 'ignored_no_open_check' };
    }
    if (check.status !== 'sent') return { check: { ...check }, elder: { ...elder }, contact: null, action: 'none' };

    // The approved English pilot is deliberately a single-button "I'm okay" flow.
    // Until dedicated English greeting/distress templates are approved, keep other
    // intents open for the normal reminder path instead of leaking Hebrew copy.
    if (normalizeLanguage(elder.language) === 'en_US' && response !== 'ok') {
      db.audit.push({ id: id('evt'), type: 'english_unsupported_response_ignored', payload: { elderId, checkId: check.id, response }, createdAt: nowIso() });
      return { check: null, elder: { ...elder }, contact: null, action: 'ignored_unsupported_english_response' };
    }

    check.respondedAt = nowIso();
    check.responsePayload = { response };

    let action;
    if (response === 'ok') {
      check.status = 'ok';
      action = 'ok';
    } else if (response === 'greeting') {
      check.status = 'greeting_sent';
      action = 'greeting';
    } else if (response === 'distress') {
      check.status = 'distress';
      check.alertSentAt = nowIso();
      action = 'distress';
    } else {
      throw new Error('Unknown response');
    }

    const contacts = db.contacts.filter((c) => c.elderId === elder.id && c.optInStatus === 'approved');
    const contact = contacts[0] || null;
    db.audit.push({ id: id('evt'), type: 'elder_response', payload: { elderId, checkId: check.id, response }, createdAt: nowIso() });
    return { check: { ...check }, elder: { ...elder }, contact: contact ? { ...contact } : null, action };
  });

  if (result.action === 'ok') {
    if (inboundMessageId) await sendOkReaction(result.elder, result.check, inboundMessageId, '❤️');
    else await sendOkAck(result.elder);
  }
  if (result.action === 'greeting') {
    const db = await loadDb();
    const contacts = db.contacts.filter((c) => c.elderId === result.elder.id && c.optInStatus === 'approved');
    for (const contact of contacts) await sendFamilyGreeting(contact, result.elder, result.check);
  }
  if (result.action === 'distress' && result.contact) {
    const db = await loadDb();
    const contacts = db.contacts.filter((c) => c.elderId === result.elder.id && c.optInStatus === 'approved');
    for (const contact of contacts) await sendDistressAlert(contact, result.elder, result.check);
  }
  return result.check;
}

export async function weeklyReportByToken(token, { days = 7 } = {}) {
  if (!token) throw new Error('Missing token');
  const db = await loadDb();
  const family = db.families.find((f) => f.managementToken === token);
  if (!family || family.tokenRevokedAt) throw new Error('Family not found');
  family.tokenLastUsedAt = nowIso();
  await saveDb(db);

  const since = Date.now() - Number(days || 7) * 24 * 60 * 60 * 1000;
  const elders = db.elders.filter((e) => e.familyId === family.id).map((elder) => {
    const checks = db.checks.filter((c) => c.elderId === elder.id && new Date(c.sentAt || c.scheduledAt || c.createdAt || 0).getTime() >= since);
    const counts = checks.reduce((acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    }, {});
    return {
      elderId: elder.id,
      elderName: elder.name,
      dailyCheckTime: elder.dailyCheckTime,
      active: elder.active,
      totals: {
        checks: checks.length,
        ok: counts.ok || 0,
        greetings: counts.greeting_sent || 0,
        noResponses: counts.no_response || 0,
        distress: counts.distress || 0,
        stillOpen: counts.sent || 0,
        failed: counts.failed || 0
      },
      latestChecks: checks
        .slice()
        .sort((a, b) => String(b.sentAt || b.scheduledAt).localeCompare(String(a.sentAt || a.scheduledAt)))
        .slice(0, 7)
    };
  });

  return {
    familyId: family.id,
    ownerName: family.ownerName,
    periodDays: Number(days || 7),
    generatedAt: nowIso(),
    elders
  };
}


export async function processNoResponses({ graceMinutes = 60 } = {}) {
  const dueActions = await mutateDb((db) => {
    const now = Date.now();
    const actions = [];
    for (const check of db.checks) {
      const elder = db.elders.find((e) => e.id === check.elderId);
      if (!elder || !check.sentAt) continue;
      if (check.status !== 'sent') continue;
      if (!elder.active || elder.optInStatus !== 'approved') {
        check.status = 'cancelled';
        check.cancelledAt = nowIso();
        check.cancelReason = !elder.active ? 'elder_inactive' : 'elder_opt_in_not_approved';
        db.audit.push({ id: id('evt'), type: 'daily_check_cancelled', payload: { elderId: elder.id, checkId: check.id, reason: check.cancelReason }, createdAt: nowIso() });
        continue;
      }
      const delayMinutes = elderAlertDelay(elder, graceMinutes);
      const maxAttempts = elderAlertRepeatCount(elder);
      const reminderCount = Number(check.noResponseReminderCount || 0);
      const attemptsSoFar = 1 + reminderCount;
      const currentAlerts = Number(check.noResponseAlertCount || (check.alertSentAt ? 1 : 0));
      const anchor = reminderCount > 0 ? (check.lastNoResponseReminderAt || check.sentAt) : check.sentAt;
      const elapsedMin = (now - new Date(anchor).getTime()) / 60000;
      if (elapsedMin < delayMinutes) continue;

      if (attemptsSoFar < maxAttempts) {
        const reminderAt = nowIso();
        check.noResponseReminderCount = reminderCount + 1;
        check.lastNoResponseReminderAt = reminderAt;
        db.audit.push({ id: id('evt'), type: 'no_response_reminder_sent', payload: { elderId: elder.id, checkId: check.id, reminderCount: check.noResponseReminderCount, maxAttempts, delayMinutes }, createdAt: nowIso() });
        actions.push({ type: 'reminder', check: { ...check }, elder: { ...elder } });
        continue;
      }

      if (currentAlerts >= 1) continue;
      const contacts = db.contacts.filter((c) => c.elderId === check.elderId && c.optInStatus === 'approved');
      if (!contacts.length) continue;
      check.status = 'no_response';
      const alertAt = nowIso();
      check.alertSentAt = check.alertSentAt || alertAt;
      check.lastNoResponseAlertAt = alertAt;
      check.noResponseAlertCount = currentAlerts + 1;
      db.audit.push({ id: id('evt'), type: 'no_response_alert_sent', payload: { elderId: elder.id, checkId: check.id, count: check.noResponseAlertCount, maxAttempts, delayMinutes }, createdAt: nowIso() });
      for (const contact of contacts) actions.push({ type: 'alert', check: { ...check }, elder: { ...elder }, contact: { ...contact } });
    }
    return actions;
  });

  for (const item of dueActions) {
    if (item.type === 'reminder') await sendDailyReminder(item.elder, item.check);
    if (item.type === 'alert') await sendNoResponseAlert(item.contact, item.elder, item.check);
  }
  return dueActions.map((item) => item.check);
}


export async function processDueChecks(date = new Date()) {
  const db = await loadDb();
  const due = db.elders.filter((elder) => {
    const local = localParts(date, elder.timezone || 'Asia/Jerusalem');
    if (!elder.active || elder.optInStatus !== 'approved') return false;
    const dueTime = effectiveDailyCheckTime(elder, date);
    if (local.time < dueTime) return false;
    return !db.checks.some((c) => c.elderId === elder.id && c.scheduledLocalDate === local.date && c.source === 'scheduled');
  });
  const sent = [];
  for (const elder of due) {
    const local = localParts(date, elder.timezone || 'Asia/Jerusalem');
    sent.push(await sendCheckNow(elder.id, { source: 'scheduled', scheduledLocalDate: local.date }));
  }
  return sent;
}

export async function setOptIn(elderId, approved) {
  return mutateDb((db) => {
    const elder = db.elders.find((e) => e.id === elderId);
    if (!elder) throw new Error('Elder not found');
    elder.optInStatus = approved ? 'approved' : 'declined';
    db.audit.push({ id: id('evt'), type: 'opt_in_changed', payload: { elderId, approved }, createdAt: nowIso() });
    return elder;
  });
}

export async function setContactOptIn(contactId, approved) {
  return mutateDb((db) => {
    const contact = db.contacts.find((c) => c.id === contactId);
    if (!contact) throw new Error('Contact not found');
    contact.optInStatus = approved ? 'approved' : 'declined';
    db.audit.push({ id: id('evt'), type: 'contact_opt_in_changed', payload: { contactId, elderId: contact.elderId, approved }, createdAt: nowIso() });
    return contact;
  });
}

export async function resendElderOptInByToken(token, elderId) {
  const data = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    elder.optInStatus = 'pending';
    db.audit.push({ id: id('evt'), type: 'elder_opt_in_resent', payload: { elderId }, createdAt: nowIso() });
    return { family: { ...family }, elder: { ...elder } };
  });
  await sendOptIn(data.elder, data.family);
  return { ok: true, elder: data.elder };
}

export async function resendContactOptInByToken(token, contactId) {
  const data = await mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elderIds = db.elders.filter((e) => e.familyId === family.id).map((e) => e.id);
    const contact = db.contacts.find((c) => c.id === contactId && elderIds.includes(c.elderId));
    if (!contact) throw new Error('Contact not found');
    const elder = db.elders.find((e) => e.id === contact.elderId);
    contact.optInStatus = 'pending';
    db.audit.push({ id: id('evt'), type: 'contact_opt_in_resent', payload: { contactId, elderId: contact.elderId }, createdAt: nowIso() });
    return { family: { ...family }, elder: { ...elder }, contact: { ...contact } };
  });
  await sendContactOptIn(data.contact, data.elder, data.family);
  return { ok: true, contact: data.contact };
}
