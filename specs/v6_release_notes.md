# מלאכי V6 - Release Notes

## נוסף
- Rate limiting בסיסי ל-API.
- ולידציה לטלפונים ושעות.
- תשתית security utilities.
- סכמת PostgreSQL production ב-`app/db/schema.sql`.
- הערות מעבר מ-JSON ל-DB אמיתי.
- Dockerfile.
- docker-compose.yml.
- שיפור UX וטקסטים בדף ההרשמה.

## בדיקות
- selftest עבר.
- כל הדפים וה-endpoints המרכזיים מחזירים HTTP 200.
- בדיקת טקסט CTA בדף הנחיתה עברה.

## סטטוס
המערכת עדיין רצה על JSON כברירת מחדל, אבל יש תשתית מסודרת למעבר DB production.
