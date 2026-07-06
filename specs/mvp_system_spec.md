# מלאכי - אפיון מערכת MVP

## מטרת המערכת
מערכת חינמית למשפחות: בדיקת חיים יומית לאדם מבוגר בוואטסאפ, והתראה לקרוב משפחה במקרה של מצוקה או חוסר תגובה.

## משתמשים
1. בן/בת משפחה מנהל/ת
2. אדם מבוגר/קשיש
3. איש קשר לחירום - יכול להיות אותו מנהל או אדם נוסף

## זרימת משתמש
1. בן משפחה נכנס לאתר מלאכי.
2. נרשם עם שם, טלפון, אימייל/סיסמה או קוד חד-פעמי.
3. פותח “משפחה”.
4. מזין:
   - שם האדם המבוגר
   - מספר WhatsApp של האדם המבוגר
   - שעה יומית לבדיקת חיים
   - שם + מספר WhatsApp של איש קשר לחירום
5. המערכת שולחת הודעת אישור/Opt-in לקשיש.
6. הקשיש מאשר הצטרפות.
7. כל יום בשעה שנקבעה נשלחת הודעת בדיקה.
8. אם נלחץ “הכול בסדר”: המערכת מסמנת OK ושולחת אישור קצר.
9. אם נלחץ “מצוקה”: נשלחת התראת מצוקה לקרוב.
10. אם לא התקבלה תגובה תוך שעה: נשלחת התראת חוסר תגובה.

## מסכים באתר
### דף נחיתה
- הסבר קצר
- CTA: להצטרפות חינם / כניסה לבטא
- אמון ופרטיות

### הרשמה
- שם
- טלפון
- אימייל או קוד SMS/WhatsApp בעתיד

### דשבורד משפחתי
- כרטיס קשיש
- סטטוס היום: ממתין / הכול בסדר / מצוקה / לא ענה
- שעה יומית
- איש קשר לחירום
- כפתור עריכה
- כפתור השהייה

### הוספת אדם מבוגר
- פרטים
- שעה
- איש קשר
- תיבת אישור: “יש לי הסכמה מהאדם לקבל הודעות ממלאכי”

## מודל נתונים בסיסי
### families
- id
- owner_name
- owner_phone
- owner_email
- created_at

### elders
- id
- family_id
- name
- whatsapp_phone
- daily_check_time
- timezone
- opt_in_status: pending/approved/declined
- active: true/false

### emergency_contacts
- id
- elder_id
- name
- whatsapp_phone
- relationship
- opt_in_status

### daily_checks
- id
- elder_id
- scheduled_at
- sent_at
- whatsapp_message_id
- status: scheduled/sent/ok/distress/no_response/failed
- responded_at
- response_payload
- alert_sent_at

### audit_events
- id
- family_id
- elder_id
- type
- payload
- created_at

## תהליכי backend
1. Scheduler בודק כל דקה אילו בדיקות צריך לשלוח.
2. שולח Template daily_check_he דרך Cloud API.
3. יוצר רשומת daily_check.
4. Webhook מקבל לחיצה על כפתור.
5. מעדכן סטטוס.
6. Worker בודק בדיקות sent שחלפה שעה ואין response.
7. שולח alert לקרוב.

## Stack מומלץ
### גרסת MVP מהירה וזולה
- Backend: Node.js + Express
- DB: PostgreSQL/Supabase או MySQL ב-Hostinger
- Scheduler: node-cron / cron job
- WhatsApp: Meta Cloud API
- Frontend: React/Vite או HTML פשוט עם Tailwind
- Hosting: Hostinger Node.js או VPS קטן

### למה לא WhatsApp Web לא רשמי
- סיכון חסימה
- לא יציב
- לא מתאים למוצר אמון/בטיחות
- קשה להגדיל

## בדיקות חובה לפני בטא
- שליחת הודעת בדיקה בזמן הנכון
- לחיצה “הכול בסדר” מעדכנת דשבורד
- לחיצה “מצוקה” שולחת התראה
- אין תגובה שעה שולח התראה אחת בלבד
- opt-out עובד
- עצירת שירות לקשיש עובדת
- לוגים ברורים

## מה צריך אישור לפני בנייה בפועל
- בחירת stack סופית
- שם דומיין/אחסון
- פתיחת/חיבור Meta Business
- נוסח מדיניות פרטיות
- נוסחי templates לפני הגשה ל-Meta
