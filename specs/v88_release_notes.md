# מלאכי V88 - fallback לאישור בן משפחה

## הבעיה
בבדיקת V87 רק ההורה קיבל הודעת אישור. הודעת בן/בת המשפחה נכשלה כי Meta החזירה:
`(#132001) Template name does not exist in the translation: contact_optin_he does not exist in he`.

## התיקון
- `META_TEMPLATE_CONTACT_OPTIN` הוגדר זמנית ל־`optin_confirm_he`, התבנית הקיימת שכבר עובדת.
- ברירת המחדל בקוד ל־contact opt-in משתמשת בתבנית האישור הקיימת אם לא הוגדרה תבנית ייעודית.
- webhook processor עודכן כך שאם מתקבל כפתור `approve_optin`/`decline_optin` ממספר ששייך לאיש קשר ולא להורה, הוא יעדכן את איש הקשר (`contactOptIn`) ולא יתעלם.

## למה
זה מאפשר לבדוק עכשיו את ה-flow באתר בלי להמתין לאישור תבנית חדשה מ-Meta. בהמשך אפשר להחזיר לתבנית ייעודית ונכונה יותר כש־`contact_optin_he` תאושר.
