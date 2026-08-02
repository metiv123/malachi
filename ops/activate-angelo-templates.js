#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const RENDER_KEY_FILE = '/data/.openclaw/workspace/.secrets/render-api-key';
const RENDER_SERVICE_ID = 'srv-d95uallaeets73f335qg';
const EXPECTED_PHONE = '+972 55-263-9584';
const requiredTemplates = [
  'contact_optin_angelo_en',
  'daily_check_angelo_en',
  'daily_check_reminder_angelo_en',
  'daily_ok_ack_angelo_en',
  'no_response_alert_angelo_en',
  'incomplete_signup_reminder_angelo_en'
];
const environmentUpdates = {
  META_TEMPLATE_OPTIN_EN: 'contact_optin_angelo_en',
  META_TEMPLATE_CONTACT_OPTIN_EN: 'contact_optin_angelo_en',
  META_TEMPLATE_DAILY_CHECK_EN: 'daily_check_angelo_en',
  META_TEMPLATE_DAILY_REMINDER_EN: 'daily_check_reminder_angelo_en',
  META_TEMPLATE_OK_ACK_EN: 'daily_ok_ack_angelo_en',
  META_TEMPLATE_NO_RESPONSE_ALERT_EN: 'no_response_alert_angelo_en',
  META_TEMPLATE_INCOMPLETE_SIGNUP_REMINDER_EN: 'incomplete_signup_reminder_angelo_en'
};

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(`${message} (${response.status})`);
  }
  return data;
}

async function main() {
  const renderKey = (await readFile(RENDER_KEY_FILE, 'utf8')).trim();
  const renderHeaders = { Authorization: `Bearer ${renderKey}`, 'Content-Type': 'application/json' };
  const rows = await jsonFetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars?limit=100`, { headers: renderHeaders });
  const env = Object.fromEntries(rows.map((row) => [row.envVar.key, row.envVar.value]));
  const token = env.META_ACCESS_TOKEN;
  const phoneId = env.META_PHONE_NUMBER_ID;
  const wabaId = env.META_WABA_ID;
  const version = env.META_GRAPH_VERSION || 'v23.0';
  if (!token || !phoneId || !wabaId) throw new Error('Required production Meta environment is incomplete');

  const graphHeaders = { Authorization: `Bearer ${token}` };
  const phone = await jsonFetch(`https://graph.facebook.com/${version}/${phoneId}?fields=display_phone_number,quality_rating,status`, { headers: graphHeaders });
  if (phone.display_phone_number !== EXPECTED_PHONE || phone.status !== 'CONNECTED') {
    throw new Error('Production phone identity validation failed; activation stopped');
  }

  const fields = encodeURIComponent('name,status,rejected_reason');
  const listed = await jsonFetch(`https://graph.facebook.com/${version}/${wabaId}/message_templates?fields=${fields}&limit=250`, { headers: graphHeaders });
  const statusByName = new Map((listed.data || []).map((template) => [template.name, template.status]));
  const pending = requiredTemplates.filter((name) => statusByName.get(name) !== 'APPROVED');
  if (pending.length) {
    console.log(`result=pending approved=${requiredTemplates.length - pending.length} total=${requiredTemplates.length}`);
    for (const name of pending) console.log(`${name} status=${statusByName.get(name) || 'MISSING'}`);
    return;
  }

  const alreadyActive = Object.entries(environmentUpdates).every(([key, value]) => env[key] === value);
  if (alreadyActive) {
    console.log('result=already_active approved=6 total=6');
    return;
  }

  const nextEnvironment = { ...env, ...environmentUpdates };
  await jsonFetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars`, {
    method: 'PUT',
    headers: renderHeaders,
    body: JSON.stringify(Object.entries(nextEnvironment).map(([key, value]) => ({ key, value })))
  });
  const deploy = await jsonFetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys`, {
    method: 'POST',
    headers: renderHeaders,
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });
  console.log(`result=activated approved=6 total=6 deploy_id=${deploy.id || 'queued'}`);
}

main().catch((error) => {
  console.error(`angelo_template_activation_failed=${error.message}`);
  process.exitCode = 1;
});
