#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="$ROOT/uk-static-site"
API_BASE="${MALACHI_STATIC_API_BASE:-https://malachi-v78v.onrender.com}"
export API_BASE
rm -rf "$OUT"
mkdir -p "$OUT"
for page in index demo privacy terms accessibility data-deletion f w; do
  cp "$ROOT/app/public/en/$page.html" "$OUT/$page.html"
done
cp "$ROOT/app/public/en/"*.css "$OUT/"
cp "$ROOT/app/public/analytics.js" "$OUT/analytics.js"
cp -R "$ROOT/app/public/assets" "$OUT/assets"
cat > "$OUT/config.js" <<EOF
window.MALACHI_API_BASE = '$API_BASE';
EOF
cd "$ROOT"
python3 - <<'PY'
from pathlib import Path
import os
root=Path('uk-static-site')
api=os.environ['API_BASE'].rstrip('/')
local_pages={'/en/':'index.html','/en/index.html':'index.html','/en/demo.html':'demo.html','/en/privacy.html':'privacy.html','/en/terms.html':'terms.html','/en/accessibility.html':'accessibility.html','/en/data-deletion.html':'data-deletion.html'}
api_pages=['create-user.html','login.html','dashboard.html']
for p in root.glob('*.html'):
    s=p.read_text()
    s=s.replace('href="/en/site.css"', 'href="site.css"')
    s=s.replace('src="/analytics.js"', 'src="analytics.js"')
    s=s.replace('src="/config.js"', 'src="config.js"')
    s=s.replace('src="/assets/', 'src="assets/')
    s=s.replace('href="/assets/', 'href="assets/')
    for source,target in local_pages.items():
        s=s.replace(f'href="{source}"', f'href="{target}"')
    for page in api_pages:
        s=s.replace(f'href="/en/{page}"', f'href="{api}/en/{page}"')
    p.write_text(s)
PY
printf '%s\n' "$OUT"
