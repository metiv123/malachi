# מלאכי V66 - Release Notes

## תיקון מצב WhatsApp חי
- תוקן `render.yaml` כך ש־`WHATSAPP_PROVIDER=meta` ולא `mock`.
- נשארה הגדרת בדיקה: `MALACHI_NO_RESPONSE_GRACE_MINUTES=7`.

## למה זה חשוב
- ב־V65 ה־scheduler כן סימן אי־מענה אחרי כ־7 דקות, אבל Render עבר ל־mock ולכן הודעת המשפחה נרשמה ביומן ולא נשלחה בפועל ל־WhatsApp.
- V66 מחזיר את השרת למצב Meta חי.
