# מלאכי V40 - Project Status

## סטטוס כללי
הפרויקט הוא MVP מתקדם במצב mock, מוכן לדמו פנימי ולבדיקות מוצר.
עדיין לא מחובר ל-WhatsApp Meta חי ולא פרוס ציבורית.

## מה עובד
- דף נחיתה בעברית
- טופס הרשמה
- קישור ניהול פרטי למשפחה
- דשבורד משפחתי
- יצירת אדם מבוגר ואיש קשר
- אנשי קשר מרובים
- שליחת בדיקה עכשיו במצב mock
- תזמון יומי אוטומטי
- מניעת כפילות יומית
- “הכול בסדר”
- “מצוקה”
- no-response alert
- opt-out
- היסטוריה
- לוג הודעות יוצאות
- admin diagnostics
- readiness / beta readiness / checklist
- export CSV / JSON
- backup
- error log
- audit log
- תוכן שיווקי ובטא
- Meta templates מוכנים להגשה

## מה לא עובד עדיין בלי פעולה חיצונית
- שליחת WhatsApp אמיתית
- Webhook Meta אמיתי
- פריסה ציבורית
- DB production אמיתי
- OTP אמיתי

## פקודות
```bash
cd app
npm test
npm run test:scheduler
npm start
```

## דפים
- `/`
- `/dashboard.html?token=...`
- `/admin.html`
- `/faq.html`
- `/onboarding.html`
- `/status.html`
- `/privacy.html`
- `/terms.html`
- `/data-deletion.html`

## המלצה לשלב הבא פנימי
להמשיך לשפר UX, readiness, ושכבת production DB עד שתינתן הוראה לחיבור Meta/פריסה.

## חסמי מעבר למשפחות אמיתיות
- אישור המשתמש לחיבור Meta
- Meta Business + Templates
- דומיין HTTPS
- החלטה על DB production
