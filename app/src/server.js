import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { addContactByToken, addElderByToken, adminConversations, adminSimpleOverview, betaStatus, betaUpdateCandidates, cancelOpenChecks, createFamily, createUserAccount, deleteContactByToken, deleteFamilyByToken, exportFamiliesCsv, getCheckHistoryByToken, getFamilyByToken, getOutboundMessagesByToken, handleElderResponse, incompleteSignupReminderCandidates, listDashboard, loginFamily, normalizeFamilyContactOptIns, processDueChecks, processNoResponses, regenerateFamilyToken, resendContactOptInByToken, resendElderOptInByToken, revokeFamilyToken, sendBetaUpdateToRecentContact, sendBetaUpdateToRecentContacts, sendCheckNow, sendIncompleteSignupReminders, sendReplyToRecentInbound, setElderActiveByToken, setFamilyPasswordByToken, setMarketingConsentByEmail, setOptIn, sourceReport, systemReadiness, updateElderByToken, waitlistReport, weeklyReportByToken } from './malachi.js';
import { loadDb } from './store.js';
import { processWhatsAppWebhookPayload } from './webhookProcessor.js';
import { getHodayaAgentStatus, listHodayaAgentMessages, prepareHodayaWindowOpenTemplate, sendHodayaAgentReply, triggerHodayaEventDrivenTurn } from './hodayaAgent.js';
import { startScheduler } from './scheduler.js';
import { csvResponse } from './csv.js';
import { rateLimit } from './security.js';
import { metaReadiness, sampleMetaPayloads } from './metaReadiness.js';
import { betaReadiness } from './betaReadiness.js';
import { betaChecklist } from './betaChecklist.js';
import { version } from './version.js';
import { liveReadiness } from './liveReadiness.js';
import { checkMetaPhoneNumber } from './metaApiCheck.js';
import { listConnectionTemplates, submitConnectionTemplates, submitHodayaAgentTemplate } from './metaTemplatesAdmin.js';
import { createBackup, exportDbJson, listBackups } from './backup.js';
import { listErrors, logError } from './errorLog.js';
import { createFeedback, listFeedback } from './feedback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

function installProcessGuards() {
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    console.error('[process] unhandledRejection', err.stack || err.message);
    logError('unhandled_rejection', err).catch(() => {});
  });
  process.on('uncaughtException', (err) => {
    console.error('[process] uncaughtException', err.stack || err.message);
    logError('uncaught_exception', err).catch(() => {});
  });
}

let selfKeepaliveTimer = null;

export function startSelfKeepalive() {
  if (!config.selfKeepaliveEnabled || selfKeepaliveTimer) return;
  if (!config.publicBaseUrl || config.publicBaseUrl.includes('localhost')) return;
  const url = `${config.publicBaseUrl.replace(/\/$/, '')}/api/health`;
  async function ping() {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Malachi-Self-Keepalive/1.0' } });
      console.log(`[self-keepalive] ${url} status=${res.status}`);
    } catch (err) {
      console.error('[self-keepalive] error', err.message);
      logError('self_keepalive', err, { url }).catch(() => {});
    }
  }
  selfKeepaliveTimer = setInterval(ping, config.selfKeepaliveIntervalMs);
  setTimeout(ping, 30000);
  console.log(`[self-keepalive] enabled interval=${config.selfKeepaliveIntervalMs}ms url=${url}`);
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() });
  res.end(JSON.stringify(data, null, 2));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
  };
}

const adminPagePaths = new Set(['/admin.html', '/admin-feedback.html', '/admin-marketing.html']);
const adminGetApiPaths = new Set([
  '/api/dashboard', '/api/waitlist', '/api/feedback', '/api/debug/db', '/api/readiness', '/api/beta/readiness',
  '/api/beta/checklist', '/api/meta/readiness', '/api/meta/sample-payloads', '/api/meta/phone-check',
  '/api/meta/templates/connection', '/api/reports/sources', '/api/export/families.csv', '/api/export/db.json',
  '/api/backups', '/api/errors', '/api/audit', '/api/inbound-messages', '/api/admin/simple-overview', '/api/admin/conversations', '/api/admin/beta-update-candidates', '/api/admin/incomplete-signup-reminder-candidates', '/api/admin/hodaya-agent/status', '/api/admin/hodaya-agent/messages', '/api/meta/templates/hodaya-agent'
]);
const adminPostApiPaths = new Set([
  '/api/backups', '/api/dev/demo-family', '/api/jobs/due-checks', '/api/jobs/no-responses',
  '/api/mock/respond', '/api/mock/webhook', '/api/meta/templates/connection', '/api/meta/templates/hodaya-agent', '/api/admin/beta-update', '/api/admin/beta-update-target', '/api/admin/incomplete-signup-reminder', '/api/admin/normalize-family-contact-opt-ins', '/api/admin/cancel-open-checks', '/api/admin/inbound-reply', '/api/admin/hodaya-agent/window-open', '/api/admin/hodaya-agent/reply', '/api/admin/hodaya-agent/event-trigger'
]);

function isAdminProtectedRoute(req, url) {
  if (adminPagePaths.has(url.pathname)) return true;
  if (req.method === 'GET' && adminGetApiPaths.has(url.pathname)) return true;
  if (req.method === 'POST' && adminPostApiPaths.has(url.pathname)) return true;
  if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/opt-in$/)) return true;
  return false;
}

function tokenFrom(req, url) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return url.searchParams.get('adminToken') || req.headers['x-admin-token'] || '';
}

function isAdminRequest(req, url) {
  return Boolean(config.adminToken && tokenFrom(req, url) === config.adminToken);
}

function requireAdmin(req, res, url) {
  if (!config.adminToken) {
    json(res, 503, { error: 'Admin access is locked until MALACHI_ADMIN_TOKEN is configured' });
    return false;
  }
  if (!isAdminRequest(req, url)) {
    json(res, 401, { error: 'Admin token required' });
    return false;
  }
  return true;
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  return JSON.parse(raw);
}

async function staticFile(res, pathname, { head = false } = {}) {
  const file = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const target = path.resolve(publicDir, file);
  if (!target.startsWith(publicDir)) throw new Error('Bad path');
  const ext = path.extname(target);
  const type = ext === '.css' ? 'text/css; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'text/html; charset=utf-8';
  let data;
  try {
    data = await readFile(target);
  } catch (err) {
    if (err?.code === 'ENOENT') {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Malachi-Version': version.version
      });
      return res.end(head ? undefined : 'Not found');
    }
    throw err;
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0',
    'X-Malachi-Version': version.version
  });
  res.end(head ? undefined : data);
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      return res.end();
    }
    if (!rateLimit(req, { key: url.pathname, limit: url.pathname.startsWith('/api/') ? 180 : 300 })) {
      return json(res, 429, { error: 'Too many requests' });
    }
    if (isAdminProtectedRoute(req, url)) {
      if (!requireAdmin(req, res, url)) return;
    }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, provider: config.whatsappProvider, version });
    if (req.method === 'GET' && url.pathname === '/api/version') return json(res, 200, version);
    if (req.method === 'GET' && url.pathname === '/api/beta/status') return json(res, 200, await betaStatus());
    if (req.method === 'GET' && url.pathname === '/api/feedback') return json(res, 200, { feedback: await listFeedback() });
    if (req.method === 'POST' && url.pathname === '/api/feedback') return json(res, 201, { feedback: await createFeedback(await body(req)) });
    if (req.method === 'GET' && url.pathname === '/api/waitlist') return json(res, 200, { waitlist: await waitlistReport() });
    if (req.method === 'GET' && url.pathname === '/api/dashboard') return json(res, 200, { families: await listDashboard() });
    if (req.method === 'GET' && url.pathname === '/api/family') return json(res, 200, { family: await getFamilyByToken(url.searchParams.get('token')) });
    if (req.method === 'GET' && url.pathname.match(/^\/api\/elders\/[^/]+\/history$/)) {
      const elderId = url.pathname.split('/')[3];
      return json(res, 200, { checks: await getCheckHistoryByToken(url.searchParams.get('token'), elderId) });
    }
    if (req.method === 'GET' && url.pathname === '/api/outbound-messages') {
      return json(res, 200, { messages: await getOutboundMessagesByToken(url.searchParams.get('token'), url.searchParams.get('elderId')) });
    }
    if (req.method === 'GET' && url.pathname === '/api/reports/weekly') {
      return json(res, 200, { report: await weeklyReportByToken(url.searchParams.get('token'), { days: Number(url.searchParams.get('days') || 7) }) });
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/simple-overview') return json(res, 200, await adminSimpleOverview());
    if (req.method === 'GET' && url.pathname === '/api/admin/conversations') return json(res, 200, { conversations: await adminConversations({ limit: Number(url.searchParams.get('limit') || 50) }) });
    if (req.method === 'GET' && url.pathname === '/api/admin/beta-update-candidates') return json(res, 200, await betaUpdateCandidates({ hours: Number(url.searchParams.get('hours') || 24), includeTests: url.searchParams.get('includeTests') === 'true' }));
    if (req.method === 'GET' && url.pathname === '/api/admin/incomplete-signup-reminder-candidates') return json(res, 200, await incompleteSignupReminderCandidates({ familyId: url.searchParams.get('familyId') || '', phoneLast4: url.searchParams.get('phoneLast4') || '', ownerEmail: url.searchParams.get('ownerEmail') || '', includeTests: url.searchParams.get('includeTests') === 'true' }));
    if (req.method === 'GET' && url.pathname === '/api/admin/hodaya-agent/status') return json(res, 200, await getHodayaAgentStatus());
    if (req.method === 'GET' && url.pathname === '/api/admin/hodaya-agent/messages') return json(res, 200, await listHodayaAgentMessages({ limit: Number(url.searchParams.get('limit') || 20) }));
    if (req.method === 'GET' && url.pathname === '/api/debug/db') return json(res, 200, await loadDb());
    if (req.method === 'GET' && url.pathname === '/api/readiness') return json(res, 200, await systemReadiness());
    if (req.method === 'GET' && url.pathname === '/api/beta/readiness') return json(res, 200, await betaReadiness());
    if (req.method === 'GET' && url.pathname === '/api/beta/checklist') return json(res, 200, await betaChecklist());
    if (req.method === 'GET' && url.pathname === '/api/meta/readiness') return json(res, 200, metaReadiness());
    if (req.method === 'GET' && url.pathname === '/api/live/readiness') {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const requestBaseUrl = host ? `${proto}://${host}` : null;
      return json(res, 200, liveReadiness(requestBaseUrl));
    }
    if (req.method === 'GET' && url.pathname === '/api/meta/sample-payloads') return json(res, 200, sampleMetaPayloads());
    if (req.method === 'GET' && url.pathname === '/api/meta/phone-check') return json(res, 200, await checkMetaPhoneNumber());

    if (req.method === 'GET' && url.pathname === '/api/meta/templates/connection') {
      if (!isAdminRequest(req, url) && url.searchParams.get('token') !== config.meta.verifyToken) return json(res, 403, { error: 'Forbidden' });
      return json(res, 200, await listConnectionTemplates({ wabaId: url.searchParams.get('wabaId') || undefined }));
    }
    if (req.method === 'POST' && url.pathname === '/api/meta/templates/connection') {
      const input = await body(req);
      if (!isAdminRequest(req, url) && input.token !== config.meta.verifyToken) return json(res, 403, { error: 'Forbidden' });
      return json(res, 200, await submitConnectionTemplates({ wabaId: input.wabaId }));
    }
    if (req.method === 'POST' && url.pathname === '/api/meta/templates/hodaya-agent') {
      const input = await body(req);
      if (!isAdminRequest(req, url) && input.token !== config.meta.verifyToken) return json(res, 403, { error: 'Forbidden' });
      return json(res, 200, await submitHodayaAgentTemplate({ wabaId: input.wabaId }));
    }
    if (req.method === 'GET' && url.pathname === '/api/reports/sources') return json(res, 200, { sources: await sourceReport() });
    if (req.method === 'POST' && url.pathname === '/api/auth/login') return json(res, 200, await loginFamily(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/auth/set-password') { const input = await body(req); return json(res, 200, await setFamilyPasswordByToken(input.token, input)); }
    if (req.method === 'POST' && url.pathname === '/api/marketing/consent') return json(res, 200, await setMarketingConsentByEmail(await body(req)));
    if (req.method === 'GET' && url.pathname === '/api/export/families.csv') return csvResponse(res, 'malachi-families.csv', await exportFamiliesCsv());
    if (req.method === 'GET' && url.pathname === '/api/export/db.json') { res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="malachi-db.json"'}); return res.end(await exportDbJson()); }
    if (req.method === 'GET' && url.pathname === '/api/backups') return json(res, 200, { backups: await listBackups() });
    if (req.method === 'GET' && url.pathname === '/api/errors') return json(res, 200, { errors: await listErrors(Number(url.searchParams.get('limit') || 50)) });
    if (req.method === 'GET' && url.pathname === '/api/audit') { const db = await loadDb(); return json(res, 200, { audit: db.audit.slice().reverse().slice(0, Number(url.searchParams.get('limit') || 100)) }); }
    if (req.method === 'GET' && url.pathname === '/api/inbound-messages') { const db = await loadDb(); return json(res, 200, { messages: (db.inboundMessages || []).slice().reverse().slice(0, Number(url.searchParams.get('limit') || 100)) }); }
    if (req.method === 'POST' && url.pathname === '/api/backups') return json(res, 201, { backup: await createBackup() });
    if (req.method === 'POST' && url.pathname === '/api/admin/beta-update') return json(res, 200, await sendBetaUpdateToRecentContacts(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/beta-update-target') return json(res, 200, await sendBetaUpdateToRecentContact(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/incomplete-signup-reminder') return json(res, 200, await sendIncompleteSignupReminders(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/normalize-family-contact-opt-ins') return json(res, 200, await normalizeFamilyContactOptIns(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/cancel-open-checks') return json(res, 200, await cancelOpenChecks(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/inbound-reply') return json(res, 200, await sendReplyToRecentInbound(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/hodaya-agent/window-open') return json(res, 200, await prepareHodayaWindowOpenTemplate(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/hodaya-agent/reply') return json(res, 200, await sendHodayaAgentReply(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/admin/hodaya-agent/event-trigger') return json(res, 200, await triggerHodayaEventDrivenTurn(await body(req)));

    if (req.method === 'POST' && url.pathname === '/api/families') return json(res, 201, await createFamily(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/users') return json(res, 201, await createUserAccount(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/dev/demo-family') {
      if (!config.devToolsEnabled) return json(res, 403, { error: 'Dev tools disabled' });
      return json(res, 201, await createFamily({ ownerName: 'משפחת דמו', ownerPhone: '+972501111111', elderName: 'רחל דמו', elderPhone: '+972502222222', dailyCheckTime: '09:00', contactName: 'איש קשר דמו', contactPhone: '+972503333333', consent: 'on', source: 'dev_demo' }));
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/contacts$/)) {
      const elderId = url.pathname.split('/')[3];
      const input = await body(req);
      return json(res, 201, { contact: await addContactByToken(input.token, elderId, input) });
    }
    if (req.method === 'POST' && url.pathname === '/api/elders') { const input = await body(req); return json(res, 201, await addElderByToken(input.token, input)); }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/contacts\/[^/]+\/delete$/)) {
      const contactId = url.pathname.split('/')[3];
      return json(res, 200, await deleteContactByToken((await body(req)).token, contactId));
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/contacts\/[^/]+\/resend-optin$/)) {
      const contactId = url.pathname.split('/')[3];
      return json(res, 200, await resendContactOptInByToken((await body(req)).token, contactId));
    }
    if (req.method === 'POST' && url.pathname === '/api/family/regenerate-token') return json(res, 200, await regenerateFamilyToken((await body(req)).token));
    if (req.method === 'POST' && url.pathname === '/api/family/revoke-token') return json(res, 200, await revokeFamilyToken((await body(req)).token));
    if (req.method === 'POST' && url.pathname === '/api/family/delete') return json(res, 200, await deleteFamilyByToken((await body(req)).token));
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/send-check$/)) {
      const elderId = url.pathname.split('/')[3];
      const input = await body(req);
      const family = await getFamilyByToken(input.token);
      if (!family.elders.some((elder) => elder.id === elderId)) return json(res, 403, { error: 'Forbidden' });
      return json(res, 200, { check: await sendCheckNow(elderId) });
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/update$/)) {
      const elderId = url.pathname.split('/')[3];
      const input = await body(req);
      return json(res, 200, await updateElderByToken(input.token, elderId, input));
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/active$/)) {
      const elderId = url.pathname.split('/')[3];
      const input = await body(req);
      return json(res, 200, { elder: await setElderActiveByToken(input.token, elderId, input.active) });
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/opt-in$/)) {
      const elderId = url.pathname.split('/')[3];
      const input = await body(req);
      return json(res, 200, { elder: await setOptIn(elderId, input.approved !== false) });
    }
    if (req.method === 'POST' && url.pathname.match(/^\/api\/elders\/[^/]+\/resend-optin$/)) {
      const elderId = url.pathname.split('/')[3];
      return json(res, 200, await resendElderOptInByToken((await body(req)).token, elderId));
    }
    if (req.method === 'POST' && url.pathname === '/api/mock/respond') return json(res, 200, { check: await handleElderResponse(await body(req)) });

    if (req.method === 'POST' && url.pathname === '/api/mock/webhook') {
      const input = await body(req);
      const payload = input.text
        ? { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: input.from, id: 'mock.text', timestamp: String(Math.floor(Date.now()/1000)), text: { body: input.text } }] } }] }] }
        : { entry: [{ changes: [{ value: { messages: [{ type: 'interactive', from: input.from, id: 'mock.button', timestamp: String(Math.floor(Date.now()/1000)), interactive: { button_reply: { id: input.buttonId || 'daily_ok', title: input.buttonTitle || 'הכול בסדר' } } }] } }] }] };
      const handled = await processWhatsAppWebhookPayload(payload);
      return json(res, 200, { ok: true, payload, handled });
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/due-checks') return json(res, 200, { sent: await processDueChecks() });
    if (req.method === 'POST' && url.pathname === '/api/jobs/no-responses') return json(res, 200, { alerts: await processNoResponses(await body(req)) });

    // Meta webhook verification
    if (req.method === 'GET' && (url.pathname === '/api/webhooks/whatsapp' || url.pathname === '/api/meta/webhook')) {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === config.meta.verifyToken) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(challenge || '');
      }
      return json(res, 403, { error: 'Webhook verification failed' });
    }

    if (req.method === 'POST' && (url.pathname === '/api/webhooks/whatsapp' || url.pathname === '/api/meta/webhook')) {
      const payload = await body(req);
      const handled = await processWhatsAppWebhookPayload(payload);
      return json(res, 200, { ok: true, received: true, handled });
    }

    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' });
    if (req.method === 'HEAD') return staticFile(res, url.pathname, { head: true });
    if (req.method === 'GET') return staticFile(res, url.pathname);
    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    await logError('http_route', err, { method: req.method, url: req.url }).catch(() => {});
    return json(res, 500, { error: err.message });
  }
}

export function createServer() {
  return http.createServer(route);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  installProcessGuards();
  createServer().listen(config.port, () => {
    console.log(`מלאכי MVP listening on http://localhost:${config.port}`);
    console.log(`WhatsApp provider: ${config.whatsappProvider}`);
    startScheduler();
    startSelfKeepalive();
  });
}
