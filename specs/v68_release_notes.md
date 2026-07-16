# מלאכי V68 - Release Notes

## Meta Templates Admin
- נוסף endpoint מוגן להגשת תבניות Meta החדשות דרך הטוקן שכבר מוגדר ב-Render:
  - `POST /api/meta/templates/connection`
  - `GET /api/meta/templates/connection`
- הגנה: דורש `META_VERIFY_TOKEN` ולא חושף access token.

## תבניות חדשות
- `daily_connection_check_he`
  - גוף: “בוקר טוב {{1}} 🌿\nכאן מלאכי, רק לוודא מה שלומך הבוקר.”
  - כפתורים: “הכול בסדר”, “שלח ד״ש למשפחה”
- `family_greeting_he`
  - גוף: “{{1}} שולח/ת לך דרישת שלום ❤️”

## הערה
- שליחה חיה מלאה בכפתור החדש תלויה באישור Meta לתבנית `daily_connection_check_he`.
