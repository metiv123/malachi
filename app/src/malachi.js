import { id, loadDb, mutateDb, nowIso, saveDb } from './store.js';
import { randomUUID } from 'node:crypto';
import { sendDailyCheck, sendDistressAlert, sendNoResponseAlert, sendOkAck, sendOptIn } from './whatsapp.js';
import { localParts } from './time.js';
import { validateJoinInput, isValidTime } from './validators.js';
import { config } from './config.js';

function requireField(input, field) {
  if (!input[field] || String(input[field]).trim() === '') {
    throw new Error(`Missing required field: ${field}`);
  }
  return String(input[field]).trim();
}

export async function createFamily(input) {
  validateJoinInput(input);
  const ownerName = requireField(input, 'ownerName');
  const ownerPhone = requireField(input, 'ownerPhone');
  const elderName = requireField(input, 'elderName');
  const elderPhone = requireField(input, 'elderPhone');
  const dailyCheckTime = requireField(input, 'dailyCheckTime');
  const contactName = String(input.contactName || ownerName).trim();
  const contactPhone = String(input.contactPhone || ownerPhone).trim();

  const created = await mutateDb((db) => {
    if (!config.betaOpen || db.families.length >= config.betaMaxFamilies) {
      const wait = { id: id('wait'), ownerName, ownerPhone, elderName, source: input.source || input.ref || 'direct', createdAt: nowIso() };
      db.waitlist = db.waitlist || [];
      db.waitlist.push(wait);
      return { waitlist: true, wait };
    }
    const family = {
      id: id('fam'),
      ownerName,
      ownerPhone,
      ownerEmail: input.ownerEmail || '',
      managementToken: randomUUID(),
      tokenCreatedAt: nowIso(),
      tokenRevokedAt: null,
      tokenLastUsedAt: null,
      source: input.source || input.ref || 'direct',
      createdAt: nowIso()
    };
    const elder = {
      id: id('elder'),
      familyId: family.id,
      name: elderName,
      whatsappPhone: elderPhone,
      dailyCheckTime,
      timezone: input.timezone || 'Asia/Jerusalem',
      optInStatus: input.skipOptIn ? 'approved' : 'pending',
      active: true,
      createdAt: nowIso()
    };
    const contact = {
      id: id('contact'),
      elderId: elder.id,
      name: contactName,
      whatsappPhone: contactPhone,
      relationship: input.relationship || 'קרוב משפחה',
      optInStatus: 'approved',
      createdAt: nowIso()
    };

    db.families.push(family);
    db.elders.push(elder);
    db.contacts.push(contact);
    db.audit.push({ id: id('evt'), type: 'family_created', payload: { familyId: family.id, elderId: elder.id }, createdAt: nowIso() });

    return { family, elder, contact };
  });

  if (created.waitlist) return created;

  if (!input.skipOptIn) {
    await sendOptIn(created.elder, created.family);
  }

  return created;
}

export async function addContactByToken(token, elderId, input) {
  const name = requireField(input, 'contactName');
  const phone = requireField(input, 'contactPhone');
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    const contact = { id: id('contact'), elderId, name, whatsappPhone: phone, relationship: input.relationship || 'קרוב משפחה', optInStatus: 'approved', createdAt: nowIso() };
    db.contacts.push(contact);
    db.audit.push({ id: id('evt'), type: 'contact_added', payload: { elderId, contactId: contact.id }, createdAt: nowIso() });
    return contact;
  });
}

export async function deleteContactByToken(token, contactId) {
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elderIds = db.elders.filter((e) => e.familyId === family.id).map((e) => e.id);
    const contact = db.contacts.find((c) => c.id === contactId && elderIds.includes(c.elderId));
    if (!contact) throw new Error('Contact not found');
    db.contacts = db.contacts.filter((c) => c.id !== contactId);
    db.audit.push({ id: id('evt'), type: 'contact_deleted', payload: { contactId }, createdAt: nowIso() });
    return { deleted: true };
  });
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

export async function betaStatus() {
  const db = await loadDb();
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
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === oldToken);
    if (!family || family.tokenRevokedAt) throw new Error('Family not found');
    family.managementToken = randomUUID();
    family.tokenCreatedAt = nowIso();
    family.tokenRevokedAt = null;
    family.tokenLastUsedAt = null;
    db.audit.push({ id: id('evt'), type: 'family_token_regenerated', payload: { familyId: family.id }, createdAt: nowIso() });
    return { managementToken: family.managementToken };
  });
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
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elderIds = db.elders.filter((e) => e.familyId === family.id).map((e) => e.id);
    db.families = db.families.filter((f) => f.id !== family.id);
    db.elders = db.elders.filter((e) => e.familyId !== family.id);
    db.contacts = db.contacts.filter((c) => !elderIds.includes(c.elderId));
    db.checks = db.checks.filter((c) => !elderIds.includes(c.elderId));
    db.audit.push({ id: id('evt'), type: 'family_deleted', payload: { familyId: family.id }, createdAt: nowIso() });
    return { deleted: true, familyId: family.id };
  });
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
  const rows = [['family_id','source','owner_name','owner_phone','owner_email','elder_name','elder_phone','daily_check_time','opt_in_status','active','contact_name','contact_phone','latest_status','created_at']];
  for (const family of db.families) {
    const elders = db.elders.filter((e) => e.familyId === family.id);
    for (const elder of elders) {
      const contact = db.contacts.find((c) => c.elderId === elder.id) || {};
      const latest = db.checks.filter((c) => c.elderId === elder.id).sort((a,b)=>String(b.sentAt||'').localeCompare(String(a.sentAt||'')))[0] || {};
      rows.push([family.id, family.source || 'direct', family.ownerName, family.ownerPhone, family.ownerEmail || '', elder.name, elder.whatsappPhone, elder.dailyCheckTime, elder.optInStatus, elder.active, contact.name || '', contact.whatsappPhone || '', latest.status || '', family.createdAt]);
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
  return { ...family, elders };
}

export async function updateElderByToken(token, elderId, updates) {
  return mutateDb((db) => {
    const family = db.families.find((f) => f.managementToken === token);
    if (!family) throw new Error('Family not found');
    const elder = db.elders.find((e) => e.id === elderId && e.familyId === family.id);
    if (!elder) throw new Error('Elder not found');
    const contact = db.contacts.find((c) => c.elderId === elder.id);

    if (updates.elderName) elder.name = String(updates.elderName).trim();
    if (updates.elderPhone) elder.whatsappPhone = String(updates.elderPhone).trim();
    if (updates.dailyCheckTime) {
      if (!isValidTime(updates.dailyCheckTime)) throw new Error('שעה לא תקינה');
      elder.dailyCheckTime = String(updates.dailyCheckTime).trim();
    }
    if (updates.contactName && contact) contact.name = String(updates.contactName).trim();
    if (updates.contactPhone && contact) contact.whatsappPhone = String(updates.contactPhone).trim();

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
    const check = {
      id: id('check'),
      elderId: elder.id,
      scheduledAt: nowIso(),
      sentAt: nowIso(),
      status: 'sent',
      respondedAt: null,
      alertSentAt: null,
      source,
      scheduledLocalDate
    };
    db.checks.push(check);
    db.audit.push({ id: id('evt'), type: 'daily_check_sent', payload: { elderId, checkId: check.id }, createdAt: nowIso() });
    return { elder: { ...elder }, check: { ...check } };
  });
  await sendDailyCheck(elder, check);
  return check;
}


export async function handleElderResponse({ elderId, checkId, response }) {
  const result = await mutateDb((db) => {
    const elder = db.elders.find((e) => e.id === elderId);
    if (!elder) throw new Error('Elder not found');
    const check = checkId
      ? db.checks.find((c) => c.id === checkId)
      : db.checks.filter((c) => c.elderId === elderId && c.status === 'sent').sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
    if (!check) throw new Error('Open check not found');
    if (check.status !== 'sent') return { check: { ...check }, elder: { ...elder }, contact: null, action: 'none' };

    check.respondedAt = nowIso();
    check.responsePayload = { response };

    let action;
    if (response === 'ok') {
      check.status = 'ok';
      action = 'ok';
    } else if (response === 'distress') {
      check.status = 'distress';
      check.alertSentAt = nowIso();
      action = 'distress';
    } else {
      throw new Error('Unknown response');
    }

    const contacts = db.contacts.filter((c) => c.elderId === elder.id);
    const contact = contacts[0] || null;
    db.audit.push({ id: id('evt'), type: 'elder_response', payload: { elderId, checkId: check.id, response }, createdAt: nowIso() });
    return { check: { ...check }, elder: { ...elder }, contact: contact ? { ...contact } : null, action };
  });

  if (result.action === 'ok') await sendOkAck(result.elder);
  if (result.action === 'distress' && result.contact) {
    const db = await loadDb();
    const contacts = db.contacts.filter((c) => c.elderId === result.elder.id);
    for (const contact of contacts) await sendDistressAlert(contact, result.elder, result.check);
  }
  return result.check;
}


export async function processNoResponses({ graceMinutes = 60 } = {}) {
  const dueAlerts = await mutateDb((db) => {
    const now = Date.now();
    const alerts = [];
    for (const check of db.checks) {
      if (check.status !== 'sent' || !check.sentAt) continue;
      const elapsedMin = (now - new Date(check.sentAt).getTime()) / 60000;
      if (elapsedMin < graceMinutes) continue;
      const elder = db.elders.find((e) => e.id === check.elderId);
      const contacts = db.contacts.filter((c) => c.elderId === check.elderId);
      if (!elder || !contacts.length) continue;
      check.status = 'no_response';
      check.alertSentAt = nowIso();
      db.audit.push({ id: id('evt'), type: 'no_response_alert_sent', payload: { elderId: elder.id, checkId: check.id }, createdAt: nowIso() });
      for (const contact of contacts) alerts.push({ check: { ...check }, elder: { ...elder }, contact: { ...contact } });
    }
    return alerts;
  });

  for (const item of dueAlerts) {
    await sendNoResponseAlert(item.contact, item.elder, item.check);
  }
  return dueAlerts.map((item) => item.check);
}


export async function processDueChecks(date = new Date()) {
  const db = await loadDb();
  const due = db.elders.filter((elder) => {
    const local = localParts(date, elder.timezone || 'Asia/Jerusalem');
    if (!elder.active || elder.optInStatus !== 'approved') return false;
    if (elder.dailyCheckTime !== local.time) return false;
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
