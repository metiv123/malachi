# מלאכי V85 - Release Notes

## שינוי
- נוסף self-keepalive פנימי לשרת עבור Render Free.
- כאשר `MALACHI_SELF_KEEPALIVE=true`, השרת מפינג את `MALACHI_PUBLIC_BASE_URL/api/health` אחרי 30 שניות ואז כל 4 דקות.
- נוספו משתני Render:
  - `MALACHI_SELF_KEEPALIVE=true`
  - `MALACHI_SELF_KEEPALIVE_INTERVAL_MS=240000`

## למה זה נדרש
- GitHub Actions schedule לא רץ בפועל באופן קבוע בריפו הנוכחי.
- OpenClaw cron כמשימת AI לא מתאים כ־keepalive אמין.
- self-keepalive הוא הפתרון החינמי הפשוט ביותר בתוך Render: אחרי שהשרת התעורר פעם אחת, הוא שומר את עצמו ער באמצעות בקשה ציבורית חוזרת.

## מגבלה
- אם Render מכבה את השירות לגמרי לפני ה־ping הראשון, צריך כניסה/בקשה ראשונה שתעיר אותו. אחרי שהוא עלה, ה־self-keepalive אמור לצמצם חזרה לשינה.
