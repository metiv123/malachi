# מלאכי V65 - Release Notes

## בדיקת תזמון אי-מענה
- נוסף ל-Render Blueprint משתנה סביבה:
  `MALACHI_NO_RESPONSE_GRACE_MINUTES=7`
- המטרה: לאפשר בדיקת live שבה השרת עצמו שולח התראת אי-מענה אחרי כ-7 דקות, בלי הרצה ידנית של job.

## הערה
- אם Render לא מסנכרן env vars קיימים מתוך `render.yaml` בשירות שכבר נוצר, יהיה צורך להגדיר את המשתנה ידנית בדשבורד Render.
