import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from './server.js';
import { loadDb, saveDb } from './store.js';
import { createBackup } from './backup.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function reset() {
  await rm(path.resolve(process.cwd(), 'data/db.json'), { force: true });
  await saveDb({ families: [], elders: [], contacts: [], checks: [], audit: [], inboundMessages: [], outboundMessages: [], waitlist: [], feedback: [], errors: [] });
}

async function request(base, pathname, { method = 'GET', cookie = '', body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { response, data };
}

async function run() {
  await reset();
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const rejected = await request(base, '/api/users', { method: 'POST', body: { ownerName: 'ללא הסכמה', ownerEmail: 'no@example.com', ownerPhone: '0551111111', password: 'strongpass123' } });
    assert(rejected.response.status === 400, 'server must reject account creation without legal consent');

    const created = await request(base, '/api/users', { method: 'POST', body: { ownerName: 'משפחת בדיקה', ownerEmail: 'launch@example.com', ownerPhone: '0552222222', password: 'strongpass123', termsConsent: true, privacyConsent: true } });
    assert(created.response.status === 201, 'account creation should succeed');
    assert(!JSON.stringify(created.data).includes('managementToken'), 'management token must not be exposed in account response');
    const setCookie = created.response.headers.get('set-cookie') || '';
    assert(setCookie.includes('malachi_session='), 'session cookie missing');
    assert(setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Strict'), 'session cookie security attributes missing');
    const cookie = setCookie.split(';')[0];

    const anonymousFamily = await request(base, '/api/family');
    assert(anonymousFamily.response.status === 401, 'family endpoint must require a session');
    const family = await request(base, '/api/family', { cookie });
    assert(family.response.status === 200, 'session should open family dashboard');
    assert(!('managementToken' in family.data.family) && !('passwordHash' in family.data.family), 'family response must not expose secrets');
    assert(family.response.headers.get('content-security-policy'), 'security headers missing');

    const marketingStatus = await request(base, '/api/marketing/status?days=7');
    assert(marketingStatus.response.status === 200, 'aggregate marketing status should be publicly readable');
    assert(Array.isArray(marketingStatus.data.markets) && marketingStatus.data.markets.length === 2, 'marketing status should separate Israel and UK totals');
    assert(!JSON.stringify(marketingStatus.data).includes('visitorSketch') && !JSON.stringify(marketingStatus.data).includes('sources') && !JSON.stringify(marketingStatus.data).includes('sourceFunnels') && !JSON.stringify(marketingStatus.data).includes('campaignFunnels'), 'public marketing status must not expose visitor sketches or attribution records');
    const anonymousAdminAnalytics = await request(base, '/api/admin/analytics?days=7&market=all');
    assert(anonymousAdminAnalytics.response.status !== 200, 'source-level analytics must remain admin-protected');

    const feedback = await request(base, '/api/feedback', { method: 'POST', cookie, body: { rating: '5', text: 'בדיקת מחיקה', source: 'launch_test' } });
    assert(feedback.response.status === 201 && feedback.data.feedback.family?.familyId, 'feedback should be associated through the secure session');

    const backup = await createBackup();
    assert(backup.validation.valid && backup.validation.collections.families === 1, 'active-store backup must include the family before deletion');

    const deleted = await request(base, '/api/family/delete', { method: 'POST', cookie, body: {} });
    assert(deleted.response.status === 200 && deleted.data.receiptId, 'deletion receipt missing');
    const db = await loadDb();
    assert(db.families.length === 0 && db.feedback.length === 0, 'account deletion must remove related family and feedback data');
    assert(!(db.audit || []).some((item) => item.payload?.familyId), 'account deletion must remove identifying audit references');
    const scrubbedBackup = JSON.parse(await readFile(backup.path, 'utf8'));
    assert(scrubbedBackup.families.length === 0 && scrubbedBackup.feedback.length === 0, 'account deletion must scrub local backups');
    console.log('✅ launch security selftest passed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error('❌ launch security selftest failed:', error);
  process.exitCode = 1;
});
