# מלאכי V59 - Release Notes

## שינוי
- אוחד מסלול עיבוד ה-webhook הניסיוני עם מסלול ה-webhook האמיתי דרך `processWhatsAppWebhookPayload`, כדי למנוע פער בין בדיקה במספר ניסיוני לבין התנהגות לייב עתידית.
- הורחב ה-selftest כך שהוא בודק אישור opt-in מתוך webhook בסגנון Meta/WhatsApp.
- הורחב ה-selftest כך שהוא בודק תגובת כפתור יומית מלאה דרך processor, כולל מציאת הקשיש לפי מספר ועדכון הצ׳ק הפתוח האחרון.
- תוקן route מחיקת משפחה כך שיקרא ישירות ל-`deleteFamilyByToken` בלי ביטוי מיותר ב-response.

## למה זה חשוב
- מאפשר להמשיך בדיקות עם המספר הניסיוני בביטחון גבוה יותר.
- מקטין סיכון שזרימת mock תעבוד אבל webhook אמיתי ייכשל.
- מכין את המערכת לחיבור Meta/WhatsApp אמיתי בהמשך, בלי לבצע כרגע שום חיבור חי או שליחת הודעות אמיתיות.

## בדיקות
- `npm test` עבר.
- `npm run test:consistency` עבר.
- Smoke HTTP מקומי עבר: יצירת משפחה ב-`/api/families`, שליחת בדיקה ב-`/api/elders/:id/send-check`, ותגובה דרך `/api/mock/webhook` עם סטטוס `response_recorded`.
