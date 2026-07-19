# מלאכי V92 - תמיכת Firebase Firestore לשמירת משפחות קבועה

## מה נוסף
- נוספה תמיכה ב־Firebase Admin SDK.
- `store.js` תומך עכשיו בשני דרייברים:
  - `file` — ברירת המחדל המקומית הקיימת (`app/data/db.json`)
  - `firestore` — שמירה קבועה ב־Firebase Firestore
- אם `FIREBASE_SERVICE_ACCOUNT_JSON` מוגדר, המערכת בוחרת Firestore אוטומטית.
- השמירה ב־Firestore משתמשת במסמך אחד ששומר את אותו מבנה DB הקיים, כדי לא לשבור את שאר הקוד והדשבורד.
- `mutateDb` ב־Firestore משתמש ב־transaction כדי לצמצם איבוד עדכונים במקביל.
- נוספו משתני Render:
  - `FIREBASE_SERVICE_ACCOUNT_JSON` כ־secret (`sync:false`)
  - `FIRESTORE_COLLECTION=malachi_runtime`
  - `FIRESTORE_DOCUMENT=main`
- נוסף `FIREBASE_SETUP.md` עם הוראות הפעלה.

## בדיקה
- בדיקות file-store עברו.
- ניסיון בדיקה מול Firebase עם service account נכשל כי Firestore API עדיין לא מופעל בפרויקט `malachi-7d1ab`.
- נדרש להפעיל Firestore Database פעם אחת ב־Firebase Console.

## בטיחות
- ה־Service Account JSON לא נכנס לגיט.
- אם לא מוגדר `FIREBASE_SERVICE_ACCOUNT_JSON` ב־Render, האתר ממשיך לעבוד כמו קודם עם file store.
