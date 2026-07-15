# מלאכי V60 - Release Notes

## שינוי
- נוסף audit diagnostic לכל webhook נכנס מ-WhatsApp/Meta דרך `processWhatsAppWebhookPayload`.
- הלוג שומר רק מידע אבחוני מצומצם: מספר אירועי כפתור/טקסט, סטטוס טיפול, mapping, ו-4 ספרות אחרונות של המספר — בלי לשמור תוכן מלא או טוקנים.
- הורחב selftest לוודא שנוצר אירוע `whatsapp_webhook_received` בעת עיבוד webhook.

## למה זה חשוב
- מאפשר להבדיל בין שתי בעיות:
  1. Meta בכלל לא שולחת webhook לשרת.
  2. webhook מגיע אבל לא ממופה/לא משויך לקשיש.
- הכרחי לאבחון בדיקת המספר הניסיוני החי.

## בדיקות
- `npm test` עבר.
- `npm run test:consistency` עבר.
