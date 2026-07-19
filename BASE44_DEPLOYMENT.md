# Malachi / מלאכי - Base44 Deployment Notes

> מטרה: להעלות את מלאכי לסביבה אחרת כך שהאתר, הדשבורד, WhatsApp webhook, scheduler והניהול ימשיכו לעבוד כאילו לא השתנה כלום.

## מה חשוב להבין
מלאכי הוא **לא רק אתר סטטי**. הוא כולל:

1. Frontend סטטי מתוך `app/public/`
2. שרת Node.js מתוך `app/src/server.js`
3. API endpoints להרשמה, דשבורד, בדיקות, Webhook ו־Meta
4. Scheduler שרץ בתוך השרת ושולח בדיקות לפי שעה
5. קובץ DB זמני כרגע: `app/data/db.json`
6. משתני סביבה רגישים ל־Meta WhatsApp

לכן Base44 חייב לאפשר אחד מהבאים:

- הרצת Node.js backend עם `npm start`
- הגדרת Environment Variables
- כתובת HTTPS ציבורית קבועה ל־webhook
- שמירת קבצים/DB קבועה או חיבור למסד נתונים חיצוני
- תהליך שרץ תמיד או scheduler/cron חלופי

אם Base44 תומך רק ב־static frontend — האתר יעלה, אבל WhatsApp, דשבורד, scheduler והרשמות לא יעבדו מלא.

---

## Repo

GitHub repo:

```text
https://github.com/metiv123/malachi
```

ענף:

```text
main
```

גרסה נוכחית:

```text
V91
```

---

## Build / Start

Root directory for the Node app:

```text
app
```

Install command:

```bash
npm install
```

Start command:

```bash
npm start
```

Node version:

```text
>=20
```

Health check path:

```text
/api/health
```

---

## Required Environment Variables

Set these in Base44 / hosting panel. Do **not** commit real values to Git.

```bash
NODE_ENV=production
PORT=<provided-by-host-or-8787>

MALACHI_TIMEZONE=Asia/Jerusalem
MALACHI_PUBLIC_BASE_URL=https://YOUR_BASE44_DOMAIN_HERE
MALACHI_SCHEDULER=true
MALACHI_SCHEDULER_INTERVAL_MS=60000
MALACHI_NO_RESPONSE_GRACE_MINUTES=7
MALACHI_DAILY_CHECK_MODE=single_ok
MALACHI_BETA_OPEN=true
MALACHI_BETA_MAX_FAMILIES=50

MALACHI_STORE=firestore
FIRESTORE_COLLECTION=malachi_runtime
FIRESTORE_DOCUMENT=main
FIREBASE_SERVICE_ACCOUNT_JSON=<paste-service-account-json-as-one-line-secret>

WHATSAPP_PROVIDER=meta
META_GRAPH_VERSION=v23.0
META_PHONE_NUMBER_ID=<secret>
META_ACCESS_TOKEN=<secret>
META_VERIFY_TOKEN=<secret>

META_TEMPLATE_OPTIN=optin_confirm_he
META_TEMPLATE_CONTACT_OPTIN=optin_confirm_he
META_TEMPLATE_DAILY_CHECK=daily_check_he
META_TEMPLATE_DISTRESS_ALERT=distress_alert_he
META_TEMPLATE_NO_RESPONSE_ALERT=no_response_alert_he
META_TEMPLATE_FAMILY_GREETING=family_greeting_message_he
```

### הערה חשובה על `MALACHI_DAILY_CHECK_MODE`
כרגע צריך להשאיר:

```bash
MALACHI_DAILY_CHECK_MODE=single_ok
```

כדי שבדיקת הבוקר תצא עם כפתור אחד בלבד:

```text
הכול בסדר / אני בסדר
```

ולא להשתמש בתבנית הישנה שיש בה “מצוקה”.

---

## Meta WhatsApp Webhook

אחרי שיש דומיין חדש ב־Base44, צריך לעדכן ב־Meta:

Webhook callback URL:

```text
https://YOUR_BASE44_DOMAIN_HERE/api/meta/webhook
```

Verify token:

```text
META_VERIFY_TOKEN
```

Subscribe field:

```text
messages
```

בדיקה:

```text
GET https://YOUR_BASE44_DOMAIN_HERE/api/live/readiness
```

צריך לראות:

```json
{
  "ready": true,
  "mode": "meta",
  "blockers": []
}
```

---

## Current Data / Persistence Warning

כרגע הנתונים נשמרים בקובץ:

```text
app/data/db.json
```

ב־Render Free ראינו שהנתונים נמחקים אחרי deploy/restart כי האחסון זמני.

כדי ש־Base44 יעבוד אמיתי ולא ימחק משפחות:

- אם Base44 נותן persistent file storage — צריך לוודא ש־`app/data/db.json` נשמר בין deploys.
- אם לא — צריך להעביר את `store.js` למסד נתונים קבוע.

אפשרויות DB מומלצות:

1. Base44 database אם קיים
2. Supabase / Postgres
3. Turso / SQLite cloud
4. Render persistent disk / אחר

בלי persistence, האתר יעבוד לבדיקה, אבל נתוני משפחות יימחקו בפריסה/איתחול.

---

## Quick Post-Deploy Checklist

אחרי העלאה ל־Base44:

1. בדוק גרסה:

```text
/api/version
```

צריך להיות V91 ומעלה.

2. בדוק health:

```text
/api/health
```

צריך:

```json
{ "ok": true, "provider": "meta" }
```

3. בדוק readiness:

```text
/api/live/readiness
```

צריך `ready=true` ובלי blockers.

4. פתח אתר:

```text
/
```

5. בצע הרשמת בדיקה.

6. ודא שמופיע קישור ניהול.

7. ודא שנשלחות הודעות אישור:

- להורה
- לבן משפחה

8. ודא שבדשבורד רואים:

- סטטוס אישור הורה
- סטטוס אישור בן משפחה
- שעה יומית
- לוג הודעות

9. לחץ “שלח אישור שוב” במידת הצורך.

10. בדוק שהודעת בדיקת הבוקר היא עם כפתור אחד בלבד, בלי “מצוקה”.

---

## What must not be committed

לא להכניס ל־Git:

- `META_ACCESS_TOKEN`
- `META_VERIFY_TOKEN`
- סיסמאות
- קישורי ניהול פרטיים אמיתיים
- exports של DB עם טלפונים אמיתיים

---

## If Base44 only supports frontend

אם Base44 לא מריץ Node backend, אפשר עדיין להעלות את האתר הסטטי, אבל צריך להשאיר backend חיצוני ב־Render/שרת אחר.

במקרה כזה:

1. מריצים:

```bash
ops/build-static-site.sh
```

2. מעלים את תיקיית:

```text
static-site/
```

3. מוודאים שבתוכה יש `config.js` עם:

```js
window.MALACHI_API_BASE = 'https://BACKEND_DOMAIN_HERE';
```

אבל זה אומר שהניהול/WhatsApp עדיין תלויים בשרת backend אחר.
