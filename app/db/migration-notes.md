# מעבר מ-JSON ל-PostgreSQL/MySQL

ב-MVP הנוכחי הנתונים נשמרים ב-`data/db.json` כדי לאפשר פיתוח מהיר בלי התקנות.
לפני בטא ציבורית מומלץ לעבור ל-PostgreSQL או MySQL.

## למה
- אמינות
- גיבויים
- מניעת race conditions
- חיפוש וייצוא טובים יותר
- התאמה ליותר משפחות

## סדר מעבר
1. ליצור DB.
2. להריץ `db/schema.sql`.
3. לכתוב adapter נוסף ל-store: `store-postgres.js` או `store-mysql.js`.
4. להשאיר את הממשק הקיים: loadDb/saveDb/mutateDb או להחליף לשכבת Repository.
5. להריץ selftest מול DB אמיתי.

## לא לבצע בטא רחבה על JSON
JSON טוב לדמו ו-5 משפחות בדיקה בלבד.
