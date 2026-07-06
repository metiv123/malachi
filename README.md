# מלאכי — המלאך השומר

MVP מתקדם לבדיקת קשר יומית ב-WhatsApp עבור אנשים מבוגרים.

## מה המערכת עושה
- בן משפחה נרשם באתר.
- מגדיר אדם מבוגר, שעה יומית ואנשי קשר.
- המערכת שולחת בדיקת בוקר במצב mock/Meta.
- אם נלחץ “הכול בסדר” — הסטטוס מתעדכן.
- אם נלחץ “מצוקה” או אין תגובה — אנשי הקשר מקבלים התראה.

## סטטוס נוכחי
- עובד במצב mock.
- לא מחובר ל-Meta חי.
- לא פרוס ציבורית.

## התחלה מהירה
```bash
cd app
npm start
```
פתחו:
`http://localhost:8787`

## בדיקות
```bash
npm test
npm run test:scheduler
npm run test:consistency
```

## דפים חשובים
- `/` דף נחיתה
- `/admin.html` ניהול/בדיקות
- `/dashboard.html?token=...` דשבורד משפחתי
- `/faq.html` שאלות נפוצות
- `/status.html` סטטוס שירות

## לפני שימוש אמיתי
חובה לקבל אישור ולהשלים:
- Meta Business + WhatsApp Cloud API
- Templates מאושרים
- דומיין HTTPS
- DB production
- בדיקה מבוקרת עם משפחה אחת

## קבצי הכוונה
- `LATEST.md`
- `PROJECT_STATUS_V40.md`
- `ROADMAP.md`
- `APPROVAL_REQUIRED_NEXT_STEPS.md`
- `VERSION_MANIFEST.md`
