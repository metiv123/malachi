# מלאכי - Checklist לחיבור Meta WhatsApp Cloud API

## לפני שמתחילים
- דומיין ציבורי עם HTTPS
- עמוד מדיניות פרטיות זמין ציבורית
- עמוד תנאי שימוש
- עמוד מחיקת מידע
- Meta Business Account
- מספר טלפון ייעודי ל-WhatsApp Business שלא מחובר לוואטסאפ רגיל פעיל

## שלבי Meta
1. ליצור App ב-Meta Developers.
2. להוסיף מוצר WhatsApp.
3. לחבר/ליצור WhatsApp Business Account.
4. להוסיף מספר טלפון עסקי.
5. להגדיר Webhook:
   - Callback URL: `https://YOUR_DOMAIN/api/webhooks/whatsapp`
   - Verify token: הערך של `META_VERIFY_TOKEN`
6. להירשם לאירועי Webhook של messages.
7. ליצור Permanent/long-lived access token מתאים.
8. להגיש Templates מתוך `whatsapp_templates_for_meta.md`.
9. אחרי אישור templates, להגדיר בקובץ `.env`:
   - WHATSAPP_PROVIDER=meta
   - META_PHONE_NUMBER_ID=
   - META_ACCESS_TOKEN=
   - META_VERIFY_TOKEN=
10. לשלוח בדיקה למספר מאושר.

## בדיקות חובה אחרי חיבור
- Opt-in נשלח ונקלט
- daily_check נשלח דרך template
- לחיצה על “הכול בסדר” מופיעה ב-webhook
- לחיצה על “מצוקה” שולחת התראה לקרוב
- אין תגובה שעה שולח התראה אחת בלבד
- Opt-out/הפסקה עובד

## הערות מדיניות
- חובה הסכמה לפני שליחת הודעות.
- לא להשתמש בניסוח “מציל חיים”.
- לא להשתמש בהודעות יומיות שיווקיות בתבנית Utility.
- לשמור על שיעור חסימות נמוך באמצעות הסבר ברור והפסקה פשוטה.
