# מלאכי V11 - Runbook תחזוקה

## בדיקת מצב יומית
פתחו `/admin.html`:
- בדיקת מצב
- מוכנות Meta
- דוח מקורות

## גיבוי ידני
באדמין לחצו “גיבוי DB”.
או API:
```bash
curl -X POST https://DOMAIN/api/backups
```

## ייצוא נתונים
- CSV לידים: `/api/export/families.csv`
- JSON מלא: `/api/export/db.json`

## לפני שינוי גרסה
1. לבצע גיבוי.
2. להוריד JSON מלא.
3. להריץ selftest.
4. רק אז להפעיל גרסה חדשה.

## ניטור בטא
- לבדוק openChecks ב-`/api/readiness`
- לבדוק failedChecks
- לבדוק הודעות יוצאות בדשבורד משפחה
- לבדוק opt-outs
