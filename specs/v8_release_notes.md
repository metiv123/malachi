# מלאכי V8 - Release Notes

## נוסף
- מעקב מקור הרשמה (`source/ref`) לכל משפחה.
- תמיכה בקישורי הפצה כמו `/?ref=facebook_groups`.
- דוח מקורות ב-admin דרך `/api/reports/sources`.
- כפתור “דוח מקורות” ב-`/admin.html`.
- CSV כולל מקור הרשמה.
- מסמך קישורי הפצה ומעקב מקורות: `marketing/v8_distribution_links.md`.

## בדיקות
- selftest עבר.
- דפי admin/report/export מחזירים 200.
- דף נחיתה כולל source hidden field.
