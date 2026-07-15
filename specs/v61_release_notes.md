# מלאכי V61 - Release Notes

## שינוי
- נוספה תמיכה בפורמט לחיצת כפתור נוסף של Meta/WhatsApp: הודעות `message.type = "button"` עם `button.payload` ו-`button.text`.
- עד עכשיו המערכת זיהתה רק `interactive.button_reply`, ולכן webhook הגיע אבל לחיצת template quick reply לא זוהתה כאירוע כפתור.
- הורחב selftest לבדוק גם כפתור template quick reply בפורמט `button`.

## למה זה חשוב
- פותר את המצב שבו Meta שולחת webhook אך `buttonEvents=0`.
- מאפשר ללחיצות “הכול בסדר” / “מצוקה” מהודעות template אמיתיות להתעדכן במערכת.

## בדיקות
- `npm test` עבר.
- `npm run test:consistency` עבר.
