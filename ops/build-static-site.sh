#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="$ROOT/static-site"
API_BASE="${MALACHI_STATIC_API_BASE:-https://malachi-v78v.onrender.com}"
export API_BASE
rm -rf "$OUT"
mkdir -p "$OUT"
cp "$ROOT/app/public/"*.html "$OUT/"
cp "$ROOT/app/public/"*.css "$OUT/"
cp "$ROOT/app/public/"*.js "$OUT/"
cp -R "$ROOT/app/public/assets" "$OUT/assets"
mkdir -p "$OUT/en"
for page in index demo privacy terms accessibility data-deletion; do
  cp "$ROOT/app/public/en/$page.html" "$OUT/en/$page.html"
done
cp "$ROOT/app/public/en/site.css" "$OUT/en/site.css"
cat > "$OUT/config.js" <<EOF
window.MALACHI_API_BASE = '$API_BASE';
EOF
python3 - <<'PY'
from pathlib import Path
import os
root=Path('static-site')
api=os.environ['API_BASE'].rstrip('/')
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
        'href="/accessibility.html"':'href="accessibility.html"',
        'href="/create-user.html"':f'href="{api}/create-user.html"',
        'href="/login.html"':f'href="{api}/login.html"',
        'href="/dashboard.html"':f'href="{api}/dashboard.html"',
        'href="/feedback.html"':f'href="{api}/feedback.html"',
        'href="/status.html"':'href="status.html"',
        'href="/manager.html"':'href="manager.html"',
    }
    for a,b in replacements.items(): s=s.replace(a,b)
    # Load API config before scripts that call the API
    if 'src="app.js"' in s and 'src="config.js"' not in s:
        s=s.replace('<script src="app.js"></script>', '<script src="config.js"></script><script src="app.js"></script>')
    if 'src="dashboard.js"' in s and 'src="config.js"' not in s:
        s=s.replace('<script src="dashboard.js"></script>', '<script src="config.js"></script><script src="dashboard.js"></script>')
    s=s.replace('src="/config.js"', 'src="config.js"')
    s=s.replace('src="/accessibility.js"', 'src="accessibility.js"')
    s=s.replace('src="/assets/', 'src="assets/')
    s=s.replace('href="/assets/', 'href="assets/')
    p.write_text(s)

# English pages remain available under /en on the main site. Account pages
# intentionally open on the API origin so the secure HttpOnly session cookie
# stays first-party.
for p in (root/'en').glob('*.html'):
    s=p.read_text()
    s=s.replace('href="/en/site.css"', 'href="site.css"')
    s=s.replace('src="/assets/', 'src="../assets/')
    s=s.replace('href="/assets/', 'href="../assets/')
    for page in ['create-user.html','login.html','dashboard.html']:
        s=s.replace(f'href="/en/{page}"', f'href="{api}/en/{page}"')
    if p.name == 'index.html' and 'src="../config.js"' not in s:
        s=s.replace('<script>', '<script src="../config.js"></script><script>', 1)
    p.write_text(s)
PY
printf '%s\n' "$OUT"
