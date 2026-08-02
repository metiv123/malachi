#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const APPLY = process.argv.includes('--apply');
const RENDER_KEY_FILE = '/data/.openclaw/workspace/.secrets/render-api-key';
const RENDER_SERVICE_ID = 'srv-d95uallaeets73f335qg';
const EXPECTED_PHONE = '+972 55-263-9584';

const templateMap = new Map([
  ['contact_optin_en', 'contact_optin_angelo_en'],
  ['daily_check_en', 'daily_check_angelo_en'],
  ['daily_check_reminder_en', 'daily_check_reminder_angelo_en'],
  ['daily_ok_ack_en', 'daily_ok_ack_angelo_en'],
  ['no_response_alert_en', 'no_response_alert_angelo_en'],
  ['incomplete_signup_reminder_en', 'incomplete_signup_reminder_angelo_en']
]);

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new Error(`${message} (${response.status})`);
  }
  return data;
}

async function renderEnvironment() {
  const key = (await readFile(RENDER_KEY_FILE, 'utf8')).trim();
  const rows = await jsonFetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars?limit=100`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  return Object.fromEntries(rows.map((row) => [row.envVar.key, row.envVar.value]));
}

function replaceBrand(value) {
  if (typeof value === 'string') return value.replace(/Malachi/gi, 'Angelo');
  if (Array.isArray(value)) return value.map(replaceBrand);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceBrand(item)]));
  }
  return value;
}

async function main() {
  const env = await renderEnvironment();
  const token = env.META_ACCESS_TOKEN;
  const phoneId = env.META_PHONE_NUMBER_ID;
  const wabaId = env.META_WABA_ID;
  const version = env.META_GRAPH_VERSION || 'v23.0';
  if (!token || !phoneId || !wabaId) throw new Error('Required production Meta environment is incomplete');

  const graphHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const phone = await jsonFetch(`https://graph.facebook.com/${version}/${phoneId}?fields=display_phone_number,verified_name,quality_rating,status`, { headers: graphHeaders });
  if (phone.display_phone_number !== EXPECTED_PHONE || phone.status !== 'CONNECTED') {
    throw new Error('Production phone identity validation failed; no templates were submitted');
  }
  console.log(`production_phone=verified status=${phone.status} quality=${phone.quality_rating || 'unknown'}`);

  const fields = encodeURIComponent('name,status,category,language,rejected_reason,components');
  const listed = await jsonFetch(`https://graph.facebook.com/${version}/${wabaId}/message_templates?fields=${fields}&limit=250`, { headers: graphHeaders });
  const byName = new Map((listed.data || []).map((template) => [template.name, template]));

  const results = [];
  for (const [sourceName, targetName] of templateMap) {
    const existing = byName.get(targetName);
    if (existing) {
      results.push({ name: targetName, action: 'existing', status: existing.status });
      continue;
    }

    const source = byName.get(sourceName);
    if (!source) throw new Error(`Approved source template missing: ${sourceName}`);
    if (source.status !== 'APPROVED') throw new Error(`Source template is not approved: ${sourceName} (${source.status})`);

    const payload = {
      name: targetName,
      language: source.language,
      category: 'UTILITY',
      components: replaceBrand(source.components)
    };
    if (JSON.stringify(payload.components).match(/Malachi/i)) throw new Error(`Brand replacement incomplete for ${targetName}`);

    if (!APPLY) {
      results.push({ name: targetName, action: 'dry-run', status: 'READY' });
      continue;
    }

    const created = await jsonFetch(`https://graph.facebook.com/${version}/${wabaId}/message_templates`, {
      method: 'POST',
      headers: graphHeaders,
      body: JSON.stringify(payload)
    });
    results.push({ name: targetName, action: 'submitted', status: created.status || 'PENDING', id: created.id || null });
  }

  for (const result of results) console.log(`${result.name} action=${result.action} status=${result.status}`);
  console.log(`summary apply=${APPLY} templates=${results.length}`);
}

main().catch((error) => {
  console.error(`angelo_template_submission_failed=${error.message}`);
  process.exitCode = 1;
});
