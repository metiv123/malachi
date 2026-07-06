import { config } from './config.js';

export function metaReadiness() {
  const checks = [
    { key: 'WHATSAPP_PROVIDER', ok: ['mock', 'meta'].includes(config.whatsappProvider), value: config.whatsappProvider },
    { key: 'META_PHONE_NUMBER_ID', ok: config.whatsappProvider !== 'meta' || Boolean(config.meta.phoneNumberId), value: config.meta.phoneNumberId ? 'set' : 'missing' },
    { key: 'META_ACCESS_TOKEN', ok: config.whatsappProvider !== 'meta' || Boolean(config.meta.accessToken), value: config.meta.accessToken ? 'set' : 'missing' },
    { key: 'META_VERIFY_TOKEN', ok: Boolean(config.meta.verifyToken && config.meta.verifyToken !== 'change-me'), value: config.meta.verifyToken === 'change-me' ? 'default-change-me' : 'set' },
    { key: 'MALACHI_PUBLIC_BASE_URL', ok: Boolean(config.publicBaseUrl && !config.publicBaseUrl.includes('localhost')), value: config.publicBaseUrl }
  ];
  return { ok: checks.every((c) => c.ok), provider: config.whatsappProvider, checks };
}

export function sampleMetaPayloads() {
  return {
    dailyCheckTemplate: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '972501234567',
      type: 'template',
      template: {
        name: config.meta.templates.dailyCheck,
        language: { code: 'he' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: 'רחל' }] }
        ]
      }
    },
    distressAlertTemplate: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '972501111111',
      type: 'template',
      template: {
        name: config.meta.templates.distressAlert,
        language: { code: 'he' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: 'רחל' }, { type: 'text', text: '09:14' }] }
        ]
      }
    },
    webhookButtonExample: {
      entry: [{ changes: [{ value: { messages: [{ from: '972501234567', id: 'wamid.example', timestamp: '1', interactive: { button_reply: { id: 'daily_ok', title: 'הכול בסדר' } } }] } }] }]
    }
  };
}
