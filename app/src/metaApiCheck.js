import { config } from './config.js';

export async function checkMetaPhoneNumber() {
  if (!config.meta.phoneNumberId || !config.meta.accessToken) {
    return { ok: false, skipped: true, error: 'Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN' };
  }
  const fields = 'id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput';
  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${config.meta.phoneNumberId}?fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${config.meta.accessToken}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, error: data };
  return { ok: true, phoneNumber: data };
}
