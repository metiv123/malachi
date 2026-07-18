# מלאכי V74 - Release Notes

## משפך לידים ומדידה
- דף הנחיתה עודכן להתאים לכיוון החדש: כפתור אחד “אני בסדר” והתראה למשפחה רק אם אין תגובה.
- טקסט ההרשמה מדגיש שהשירות יופעל רק אחרי שהאדם המבוגר מאשר בעצמו/ה ב-WhatsApp.
- טופס ההרשמה שומר שדות attribution נסתרים:
  - `source`
  - `ref`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_content`
  - `utm_term`
- `app/public/app.js` קורא את הפרמטרים מה-URL ומעביר אותם לשרת, כדי שכל פרסום בפייסבוק/קבוצה/קמפיין יישמר במאגר הלידים.

## שמירת attribution בשרת
- נוספה פונקציית `leadAttribution` ב-`malachi.js`.
- משפחה חדשה שומרת `source` וגם אובייקט `attribution` מלא.
- גם רשימת המתנה שומרת attribution.
- אירוע audit של יצירת משפחה כולל attribution.

## ייצוא CSV
- ייצוא `families.csv` הורחב לכלול:
  - `ref`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_content`
  - `utm_term`

## בדיקות
- selftest עודכן לוודא שמקור ליד ו-UTM נשמרים במשפחה ומופיעים ב-CSV.
- `npm test` עבר בהצלחה.
- `npm run test:consistency` עבר בהצלחה.

## תוכן לדף העסקי של מטיב
- נוסף מסמך `marketing/v74_metiv_facebook_content_plan.md` עם בנק פוסטים ראשוני למלאכי כתת־נושא תחת המותג של מטיב.
- המסמך כולל סדרת פוסטים, UTM מומלצים, CTA, ותגובות מוכנות לשאלות נפוצות.

## לא בוצע
- לא בוצע שינוי Live.
- לא בוצע פרסום בפייסבוק.
- לא הוגשה תבנית Meta חדשה, כי הטוקן השמור פג תוקף ודורש רענון.
