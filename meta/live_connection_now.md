# מלאכי - חיבור Meta/WhatsApp Live עכשיו

## Render live URL
https://malachi-v78v.onrender.com

## Webhook Callback URL
מומלץ לשים ב-Meta:
https://malachi-v78v.onrender.com/api/webhooks/whatsapp

כתובת alias נתמכת גם:
https://malachi-v78v.onrender.com/api/meta/webhook

## Verify Token
יש לשים אותו ערך גם ב-Render וגם ב-Meta:
malachi_uVJu76bsJwQkZiFsreOqmuQQwdmJgZFwNMYozTWg

## Render Environment לפני Verify
NODE_ENV=production
MALACHI_PUBLIC_BASE_URL=https://malachi-v78v.onrender.com
META_VERIFY_TOKEN=malachi_uVJu76bsJwQkZiFsreOqmuQQwdmJgZFwNMYozTWg
WHATSAPP_PROVIDER=mock

להשאיר mock עד שה-webhook אומת ועד שיש Phone Number ID + Access Token.

## אחרי שיש WhatsApp API Setup
להוסיף ב-Render:
META_PHONE_NUMBER_ID=<from Meta>
META_ACCESS_TOKEN=<from Meta>

ואז לבדוק:
https://malachi-v78v.onrender.com/api/meta/phone-check

רק אחרי שהבדיקה ok=true:
WHATSAPP_PROVIDER=meta

## Webhook fields/subscriptions ב-Meta
Subscribe ל-field:
messages

## Templates נדרשים
- daily_check_he
- optin_confirm_he
- distress_alert_he
- no_response_alert_he
