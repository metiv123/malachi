# מלאכי V109 - תיקון גישת Admin לניהול תבניות Meta

## שינוי
- נתיבי `/api/meta/templates/connection` מקבלים כעת `adminToken` תקף במקום לדרוש גם `META_VERIFY_TOKEN` נפרד.
- אם אין Admin Token תקף, נשמרת תאימות לאחור עם `token=META_VERIFY_TOKEN`.

## למה
אחרי נעילת האדמין ב־V106, ניהול תבניות Meta היה מוגן פעמיים: גם Admin Token וגם verify token. זה הקשה על בדיקות ניהוליות דרך האדמין.

## בדיקות
- תיקון נקודתי ב־server routing.
- נדרש deploy ובדיקת endpoint חי עם adminToken.
