# מלאכי V15 - Developer Handoff

## מה יש בפרויקט
- `app/` - אפליקציית Node.js מלאה
- `app/public/` - אתר, דשבורד, אדמין, FAQ, דפי אמון
- `app/src/` - backend, scheduler, WhatsApp adapter, webhooks
- `app/db/schema.sql` - סכמת PostgreSQL עתידית
- `meta/` - תבניות וחיבור Meta
- `marketing/` - תוכנית שיווק ותוכן
- `operations/` - תחזוקה והפעלה

## הרצה מקומית
```bash
cd app
npm start
```
פתיחה:
`http://localhost:8787`

## בדיקות
```bash
cd app
npm test
```

## Docker
```bash
cd app
docker compose up --build
```

## בדיקת בריאות
- `/api/health`
- `/api/readiness`
- `/api/meta/readiness`

## דפים חשובים
- `/` דף נחיתה
- `/dashboard.html?token=...` דשבורד משפחתי
- `/admin.html` אבחון וניהול פנימי
- `/faq.html` שאלות נפוצות
- `/privacy.html` פרטיות
- `/terms.html` תנאים
- `/data-deletion.html` מחיקת מידע

## לפני פריסה ציבורית
- להחליף JSON DB ל-PostgreSQL/MySQL או לאשר בטא מוגבלת מאוד על JSON
- לשים דומיין HTTPS
- להגדיר env production
- לבצע גיבוי
- להריץ selftest
- לחבר Meta רק אחרי אישור templates
