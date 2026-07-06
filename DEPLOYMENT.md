# מלאכי - מדריך הרצה ופריסה

## הרצה מקומית
```bash
cd malachi/app
npm start
```
פתיחה בדפדפן:
http://localhost:8787

## בדיקות
```bash
cd malachi/app
npm test
```

## משתני סביבה
להעתיק:
```bash
cp .env.example .env
```
ולמלא ערכים.

## מצב פיתוח
ברירת מחדל:
```env
WHATSAPP_PROVIDER=mock
```
במצב הזה כל הודעות WhatsApp נשמרות ב-DB תחת `outboundMessages` ולא נשלחות החוצה.

## מצב Meta אמיתי
```env
WHATSAPP_PROVIDER=meta
META_PHONE_NUMBER_ID=...
META_ACCESS_TOKEN=...
META_VERIFY_TOKEN=...
```

## פריסה מומלצת ראשונית
אפשרות פשוטה:
- Hostinger VPS קטן או Node.js hosting
- Node.js 20+
- Reverse proxy עם HTTPS
- Domain/subdomain למשל: malachi.yourdomain.co.il

## חשוב לפני בטא ציבורית
- להעביר DB מ-JSON ל-PostgreSQL/MySQL
- להוסיף התחברות אמיתית וקוד חד-פעמי
- להוסיף Rate limits בסיסיים
- להוסיף גיבוי DB
- להוסיף לוגים ושגיאות
- להוסיף הסרה/השהיה מהדשבורד
