# מלאכי V32 - טקסטים להעתקה להגשת Templates ב-Meta

## תיאור שימוש כללי ל-Meta
Malachi is a family wellbeing check service. Families opt in an elderly relative to receive a daily WhatsApp check-in message. The recipient can reply that everything is okay or indicate distress. If there is distress or no response, a configured family contact receives a utility alert. The service is not marketing, not medical, and not an emergency center.

## daily_check_he
Category: Utility
Template name: daily_check_he
Language: Hebrew
Body:
בוקר טוב {{1}}, כאן מלאכי.
רק לוודא שהכול בסדר הבוקר.

Buttons:
Quick reply: הכול בסדר — id: daily_ok
Quick reply: מצוקה — id: daily_distress

Sample:
{{1}} = רחל

Use case:
Daily wellbeing check requested by the family and approved by the recipient.

## distress_alert_he
Category: Utility
Template name: distress_alert_he
Language: Hebrew
Body:
התראת מלאכי: {{1}} לחץ/ה על מצוקה בשעה {{2}}.
מומלץ ליצור קשר ולבדוק שהכול בסדר.

Sample:
{{1}} = רחל
{{2}} = 09:14

Use case:
Utility alert to the configured family contact when the recipient indicates distress.

## no_response_alert_he
Category: Utility
Template name: no_response_alert_he
Language: Hebrew
Body:
התראת מלאכי: {{1}} לא ענה/ענתה לבדיקת הבוקר עד {{2}}.
מומלץ ליצור קשר ולוודא שהכול בסדר.

Sample:
{{1}} = רחל
{{2}} = 10:00

Use case:
Utility alert to the configured family contact when no response was received within the configured time window.

## optin_confirm_he
Category: Utility
Template name: optin_confirm_he
Language: Hebrew
Body:
שלום {{1}}, כאן מלאכי.
{{2}} ביקש/ה לצרף אותך לבדיקת בוקר יומית ב-WhatsApp.
בכל יום בשעה {{3}} נשלח הודעה קצרה כדי לוודא שהכול בסדר.
להמשך השירות יש לאשר קבלת הודעות.

Buttons:
Quick reply: מאשר/ת — id: approve_optin
Quick reply: לא מעוניין/ת — id: decline_optin

Sample:
{{1}} = רחל
{{2}} = שלמה
{{3}} = 09:00
