# מלאכי V108 - תמיכה ב־WABA חדש של Meta

## שינוי
- נוספה תמיכה ב־`META_WABA_ID` בקונפיג.
- ניהול תבניות Meta כבר לא תלוי רק ב־WABA הישן הקשיח בקוד; אם מוגדר `META_WABA_ID`, הוא ישמש כברירת מחדל.
- `.env.example` עודכן עם `META_WABA_ID`.

## למה
המשתמש חיבר WhatsApp Business Account חדש למספר `+972 55-263-9584`.
ה־WABA החדש: `3945185379122126`.
ה־Phone Number ID החדש: `1250356578155994`.

## בדיקות
- `npm test` עבר.
- `npm run test:consistency` עבר.

## מצב Meta שנבדק
- הטוקן החדש עובד לקריאה מול Meta.
- המספר נמצא תחת ה־WABA החדש.
- סטטוס המספר בעת הבדיקה: `code_verification_status=NOT_VERIFIED`, `platform_type=ON_PREMISE`.
- יצירת תבניות דרך ה־API נחסמה על ידי Meta עם הודעה שאין הרשאה לנהל תבניות בחשבון הזה.
