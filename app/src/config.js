export const config = {
  port: Number(process.env.PORT || process.env.MALACHI_PORT || 8787),
  timezone: process.env.MALACHI_TIMEZONE || 'Asia/Jerusalem',
  publicBaseUrl: process.env.MALACHI_PUBLIC_BASE_URL || 'http://localhost:8787',
  schedulerEnabled: process.env.MALACHI_SCHEDULER !== 'false',
  schedulerIntervalMs: Number(process.env.MALACHI_SCHEDULER_INTERVAL_MS || 60000),
  noResponseGraceMinutes: Number(process.env.MALACHI_NO_RESPONSE_GRACE_MINUTES || 60),
  betaOpen: process.env.MALACHI_BETA_OPEN !== 'false',
  betaMaxFamilies: Number(process.env.MALACHI_BETA_MAX_FAMILIES || 50),
  devToolsEnabled: process.env.MALACHI_DEV_TOOLS === 'true' || process.env.NODE_ENV !== 'production',
  whatsappProvider: process.env.WHATSAPP_PROVIDER || 'mock',
  dailyCheckMode: process.env.MALACHI_DAILY_CHECK_MODE || 'legacy_two_button',
  meta: {
    graphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    accessToken: process.env.META_ACCESS_TOKEN || '',
    verifyToken: process.env.META_VERIFY_TOKEN || (process.env.NODE_ENV === 'production' ? '' : 'change-me'),
    templates: {
      dailyCheck: process.env.META_TEMPLATE_DAILY_CHECK || 'daily_check_he',
      distressAlert: process.env.META_TEMPLATE_DISTRESS_ALERT || 'distress_alert_he',
      noResponseAlert: process.env.META_TEMPLATE_NO_RESPONSE_ALERT || 'no_response_alert_he',
      familyGreeting: process.env.META_TEMPLATE_FAMILY_GREETING || 'family_greeting_message_he',
      optin: process.env.META_TEMPLATE_OPTIN || 'optin_confirm_he'
    }
  }
};
