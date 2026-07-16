import { config } from './config.js';

const DEFAULT_WABA_ID = '1044829384773667';

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

export async function submitConnectionTemplates({ wabaId = DEFAULT_WABA_ID } = {}) {
  const templates = [
    {
      name: 'daily_connection_check_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'בוקר טוב {{1}} 🌿\nכאן מלאכי, רק לוודא מה שלומך הבוקר.',
          example: { body_text: [['רחל']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'הכול בסדר' },
            { type: 'QUICK_REPLY', text: 'שלח ד״ש למשפחה' }
          ]
        }
      ]
    },
    {
      name: 'daily_warm_connection_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'בוקר טוב {{1}} 🌿\nבדיקת הקשר היומית של מלאכי. איך תרצה/י לעדכן את המשפחה?',
          example: { body_text: [['רחל']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'הכול בסדר' },
            { type: 'QUICK_REPLY', text: 'שלח ד״ש למשפחה' }
          ]
        }
      ]
    },
    {
      name: 'daily_family_connection_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'בדיקת הקשר היומית עבור {{1}}.\nנא לבחור אפשרות לעדכון המשפחה.',
          example: { body_text: [['רחל']] }
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', text: 'הכול בסדר' },
            { type: 'QUICK_REPLY', text: 'שלח ד״ש למשפחה' }
          ]
        }
      ]
    },
    {
      name: 'family_connection_update_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'עדכון קשר יומי ממלאכי: {{1}} ביקש/ה לעדכן את המשפחה.',
          example: { body_text: [['רחל']] }
        }
      ]
    },
    {
      name: 'family_greeting_message_he',
      language: 'he',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'הודעת מלאכי: {{1}} שולח/ת לך דרישת שלום ❤️',
          example: { body_text: [['רחל']] }
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

export async function listConnectionTemplates({ wabaId = DEFAULT_WABA_ID } = {}) {
  const fields = 'name,status,category,language,rejected_reason,components';
  const data = await metaFetch(`${wabaId}/message_templates?fields=${encodeURIComponent(fields)}&limit=100`);
  const names = new Set(['daily_connection_check_he', 'daily_warm_connection_he', 'daily_family_connection_he', 'family_connection_update_he', 'family_greeting_message_he', 'daily_check_he', 'no_response_alert_he']);
  return {
    wabaId,
    templates: (data.data || []).filter((template) => names.has(template.name))
  };
}
