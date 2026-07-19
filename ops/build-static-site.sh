#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="$ROOT/static-site"
API_BASE="${MALACHI_STATIC_API_BASE:-https://malachi-v78v.onrender.com}"
rm -rf "$OUT"
mkdir -p "$OUT"
cp "$ROOT/app/public/"*.html "$OUT/"
cp "$ROOT/app/public/"*.css "$OUT/"
cp "$ROOT/app/public/"*.js "$OUT/"
cat > "$OUT/config.js" <<EOF
window.MALACHI_API_BASE = '$API_BASE';
EOF
python3 - <<'PY'
from pathlib import Path
root=Path('static-site')
for p in root.glob('*.html'):
    s=p.read_text()
    # Assets: project-page friendly relative paths
    s=s.replace('href="/style.css"', 'href="style.css"')
    s=s.replace('src="/config.js"', 'src="config.js"')
    s=s.replace('src="/app.js"', 'src="app.js"')
    s=s.replace('src="/dashboard.js"', 'src="dashboard.js"')
    s=s.replace('src="/accessibility.js"', 'src="accessibility.js"')
    # Site navigation links
    replacements={
        'href="/"':'href="index.html"',
        'href="/index.html"':'href="index.html"',
        'href="/onboarding.html"':'href="onboarding.html"',
        'href="/faq.html"':'href="faq.html"',
        'href="/privacy.html"':'href="privacy.html"',
        'href="/terms.html"':'href="terms.html"',
        'href="/data-deletion.html"':'href="data-deletion.html"',
        'href="/dashboard.html"':'href="dashboard.html"',
        'href="/feedback.html"':'href="feedback.html"',
        'href="/status.html"':'href="status.html"',
    }
    for a,b in replacements.items(): s=s.replace(a,b)
    # Load API config before scripts that call the API
    if 'src="app.js"' in s and 'src="config.js"' not in s:
        s=s.replace('<script src="app.js"></script>', '<script src="config.js"></script><script src="app.js"></script>')
    if 'src="dashboard.js"' in s and 'src="config.js"' not in s:
        s=s.replace('<script src="dashboard.js"></script>', '<script src="config.js"></script><script src="dashboard.js"></script>')
    p.write_text(s)
PY
printf '%s\n' "$OUT"
