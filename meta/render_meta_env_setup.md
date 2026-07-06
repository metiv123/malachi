# מלאכי - Render Environment for Meta Live

ב-Render > Service > Environment צריך להגדיר:

## מצב דמו בטוח
WHATSAPP_PROVIDER=mock
NODE_ENV=production
MALACHI_DEV_TOOLS=false

## מעבר למצב Meta חי
רק אחרי שיש Meta app + WhatsApp phone number + templates:

WHATSAPP_PROVIDER=meta
META_PHONE_NUMBER_ID=<from Meta WhatsApp API Setup>
META_ACCESS_TOKEN=<Meta permanent/user/system token>
META_VERIFY_TOKEN=<choose a long private string>
META_TEMPLATE_DAILY_CHECK=daily_check_he
META_TEMPLATE_DISTRESS_ALERT=distress_alert_he
META_TEMPLATE_NO_RESPONSE_ALERT=no_response_alert_he
META_TEMPLATE_OPTIN=optin_confirm_he

## Webhook URL for Meta
https://YOUR_RENDER_DOMAIN/api/webhooks/whatsapp

## Verify Token
אותו ערך בדיוק כמו META_VERIFY_TOKEN.
