# מלאכי MVP

מערכת ראשונית עובדת לבדיקת חיים יומית ב-WhatsApp:
- אתר נחיתה + דשבורד משפחתי
- API להוספת משפחות/אדם מבוגר
- תזמון בדיקות יומיות
- כפתורי “הכול בסדר” / “מצוקה” דרך Webhook
- מצב WhatsApp מדומה לפיתוח
- Adapter ל-Meta Cloud API כשיהיו טוקנים ותבניות מאושרות

## הרצה מקומית
```bash
cd malachi/app
npm start
```
פתיחה: http://localhost:8787

## בדיקות
```bash
npm test
```

## חיבור Meta בעתיד
1. לפתוח Meta Business + WhatsApp Business Platform
2. להגדיר מספר עסקי
3. להגיש Templates לאישור
4. לשים `.env` לפי `.env.example`
5. להגדיר `WHATSAPP_PROVIDER=meta`
6. להגדיר Webhook לכתובת: `/api/webhooks/whatsapp`

בשלב הנוכחי אין שליחת WhatsApp אמיתית — זה בכוונה, כדי לבנות ולבדוק בלי להוציא כסף ובלי להיתקע באישורי Meta.
