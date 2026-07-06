#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
echo "== מלאכי: בדיקת כללי התקדמות =="
echo "כלל: שדרוג פנימי ממשיכים; פעולה חיצונית עוצרים לאישור."
echo "כלל נוסף: שליחת ZIP אינה עצירה — ממשיכים לשלב הבא."
echo "קובץ כללים: $ROOT/ops/SHIRI_PROJECT_RULES.md"
echo "מצב: $ROOT/state/progress_loop.json"
if [ -d "$ROOT/app" ]; then
  echo "== מסנכרן version =="
  (cd "$ROOT/app" && npm run version:sync)
  echo "== מריץ selftest =="
  (cd "$ROOT/app" && npm test)
  echo "== מריץ consistency =="
  (cd "$ROOT/app" && npm run test:consistency)
fi
