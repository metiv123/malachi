import { config } from './config.js';

const LEGACY_WABA_ID = '1044829384773667';

function defaultWabaId() {
  return config.meta.wabaId || LEGACY_WABA_ID;
}

async function metaFetch(path, options = {}) {
  if (!config.meta.accessToken) throw new Error('META_ACCESS_TOKEN missing');
  const res = await fetch(`https://graph.facebook.com/${config.meta.graphVersion}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.meta.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Meta template API failed ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function submitConnectionTemplates({ wabaId = defaultWabaId() } = {}) {
  const templates = [
    {
      name: 'contact_optin_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'שלום {{1}} 🌿\nכאן מלאכי. {{2}} ביקש/ה לצרף אותך לשירות קשר משפחתי ב־WhatsApp. ההודעות יישלחו לפי ההגדרות בשעה {{3}}.',
          example: { body_text: [['רחל', 'מטיב', '09:00']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'מאשר/ת' },
            { type: 'QUICK_REPLY', text: 'לא מעוניין/ת' }
          ]
        }
      ]
    },
    {
      name: 'daily_check_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'בוקר טוב {{1}} 🌿\nכאן מלאכי. רק לסמן שהכול בסדר הבוקר.',
          example: { body_text: [['רחל']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'אני בסדר' }
          ]
        }
      ]
    },
    {
      name: 'daily_check_reminder_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'היי {{1}} 🌿\nלא קיבלנו ממך מענה עדיין.\nרק רוצים לוודא שהכול בסדר.\nאפשר ללחוץ על הכפתור למטה.',
          example: { body_text: [['רחל']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'אני בסדר' }
          ]
        }
      ]
    },
    {
      name: 'no_response_alert_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'מלאכי: {{1}} לא ענה/ענתה להודעת הבוקר עד השעה {{2}}. כדאי ליצור קשר ולוודא שהכול בסדר.',
          example: { body_text: [['רחל', '09:30']] }
        }
      ]
    }
  ];

  const results = [];
  for (const template of templates) {
    try {
      const data = await metaFetch(`${wabaId}/message_templates`, {
        method: 'POST',
        body: JSON.stringify(template)
      });
      results.push({ name: template.name, ok: true, data });
    } catch (err) {
      results.push({ name: template.name, ok: false, error: err.message });
    }
  }
  return { wabaId, results };
}

export async function listConnectionTemplates({ wabaId = defaultWabaId() } = {}) {
  const fields = 'name,status,category,language,rejected_reason,components';
  const data = await metaFetch(`${wabaId}/message_templates?fields=${encodeURIComponent(fields)}&limit=100`);
  const names = new Set(['daily_connection_check_he', 'daily_warm_connection_he', 'daily_family_connection_he', 'contact_optin_he', 'family_connection_update_he', 'family_greeting_message_he', 'daily_check_he', 'daily_check_reminder_he', 'no_response_alert_he']);
  return {
    wabaId,
    templates: (data.data || []).filter((template) => names.has(template.name))
  };
}
