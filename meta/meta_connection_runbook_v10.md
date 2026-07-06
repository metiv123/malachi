# מלאכי V10 - Runbook חיבור Meta מעשי

## מה כבר קיים בקוד
- `/api/webhooks/whatsapp` לאימות וקבלת webhooks.
- `/api/meta/readiness` לבדיקת משתני סביבה.
- `/api/meta/sample-payloads` לדוגמאות payload.
- Adapter שליחה ב-`src/whatsapp.js`.
- Templates ב-`meta/whatsapp_templates_for_meta.md`.

## לפני חיבור אמיתי
לא לבצע לפני שיש:
- דומיין HTTPS ציבורי.
- Meta Business פעיל.
- WhatsApp Business Platform.
- מספר טלפון ייעודי.
- Templates מאושרים.

## משתני סביבה Production
```env
WHATSAPP_PROVIDER=meta
MALACHI_PUBLIC_BASE_URL=https://DOMAIN
META_GRAPH_VERSION=v23.0
META_PHONE_NUMBER_ID=...
META_ACCESS_TOKEN=...
META_VERIFY_TOKEN=בחרו_טוקן_אקראי_ארוך
META_TEMPLATE_DAILY_CHECK=daily_check_he
META_TEMPLATE_DISTRESS_ALERT=distress_alert_he
META_TEMPLATE_NO_RESPONSE_ALERT=no_response_alert_he
META_TEMPLATE_OPTIN=optin_confirm_he
```

## Callback URL ב-Meta
`https://DOMAIN/api/webhooks/whatsapp`

## Verify token
הערך של `META_VERIFY_TOKEN`.

## בדיקת מוכנות אחרי פריסה
פתחו:
`https://DOMAIN/admin.html`
ולחצו:
- מוכנות Meta
- דוגמאות Payload
- בדיקת מצב

## סדר בדיקות אחרי חיבור
1. להפעיל `WHATSAPP_PROVIDER=mock` ולוודא שהמערכת עובדת.
2. להחליף ל-`WHATSAPP_PROVIDER=meta`.
3. לשלוח opt-in למספר בדיקה.
4. לאשר ב-WhatsApp.
5. לשלוח בדיקה עכשיו מהדשבורד.
6. ללחוץ “הכול בסדר”.
7. לבדוק שהסטטוס מתעדכן.
8. לשלוח בדיקה נוספת וללחוץ “מצוקה”.
9. לבדוק שההתראה נשלחת לאיש קשר.
10. לבדוק no-response עם grace נמוך בסביבת בדיקה.

## בעיות נפוצות
- 403 באימות webhook: verify token לא תואם.
- הודעה לא נשלחת: template לא מאושר או שם template שגוי.
- לחיצה לא מתמפה: button id/title שונה ממה שהקוד מצפה.
- משתמש לא מקבל הודעה: אין opt-in / מספר לא תקין / מגבלות Meta.
