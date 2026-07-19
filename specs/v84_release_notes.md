# מלאכי V84 - Release Notes

## שינוי
- נוספו process guards לשרת Node עבור `unhandledRejection` ו־`uncaughtException`, כדי לתעד שגיאות לא צפויות ולצמצם נפילת process מלאה (`Exited with status 1`).
- נוסף שירות `malachi-static` ל־`render.yaml` כ־Render Static Site מתוך `static-site`.
- מטרת V84 היא לנסות פתרון פשוט מהשורש: דפים ציבוריים סטטיים בנפרד, API דינמי בנפרד.

## הערה
- GitHub Pages נבדק אך נחסם על ידי GitHub plan/repository settings.
- Render Static Site הוא ניסיון ביניים מהיר: עדיין Render, אבל בלי שרת Node עבור הדפים המשפטיים והציבוריים.
