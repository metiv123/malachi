import { config } from './config.js';

function has(value) { return Boolean(String(value || '').trim()); }

export function liveReadiness() {
  const checks = [
    { key: 'nodeEnvProduction', label: 'NODE_ENV=production', ok: process.env.NODE_ENV === 'production' },
    { key: 'publicBaseUrl', label: 'MALACHI_PUBLIC_BASE_URL configured', ok: has(config.publicBaseUrl) && !config.publicBaseUrl.includes('localhost') },
    { key: 'providerMeta', label: 'WHATSAPP_PROVIDER=meta', ok: config.whatsappProvider === 'meta' },
    { key: 'phoneNumberId', label: 'META_PHONE_NUMBER_ID configured', ok: has(config.meta.phoneNumberId) },
    { key: 'accessToken', label: 'META_ACCESS_TOKEN configured', ok: has(config.meta.accessToken) },
    { key: 'verifyToken', label: 'META_VERIFY_TOKEN configured and not default', ok: has(config.meta.verifyToken) && config.meta.verifyToken !== 'change-me' },
    { key: 'dailyTemplate', label: 'Daily check template configured', ok: has(config.meta.templates.dailyCheck) },
    { key: 'distressTemplate', label: 'Distress alert template configured', ok: has(config.meta.templates.distressAlert) },
    { key: 'noResponseTemplate', label: 'No-response alert template configured', ok: has(config.meta.templates.noResponseAlert) },
    { key: 'optinTemplate', label: 'Opt-in template configured', ok: has(config.meta.templates.optin) }
  ];
  const blockers = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    ready: blockers.length === 0,
    mode: config.whatsappProvider,
    webhookUrl: `${config.publicBaseUrl.replace(/\/$/, '')}/api/meta/webhook`,
    checks,
    blockers
  };
}
