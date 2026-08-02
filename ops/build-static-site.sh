#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUT="$ROOT/static-site"
API_BASE="${MALACHI_STATIC_API_BASE:-https://malachi-v78v.onrender.com}"
export API_BASE OUT
rm -rf "$OUT"
mkdir -p "$OUT"
# Publish only public marketing pages. Account, dashboard and admin pages stay
# on the application service and must not be copied to the marketing host.
for page in index.html demo-ai.html onboarding.html faq.html privacy.html terms.html accessibility.html data-deletion.html; do
  cp "$ROOT/app/public/$page" "$OUT/$page"
done
cp "$ROOT/app/public/style.css" "$OUT/style.css"
cp "$ROOT/app/public/accessibility.js" "$OUT/accessibility.js"
cp "$ROOT/app/public/robots.txt" "$OUT/robots.txt"
cp "$ROOT/app/public/sitemap.xml" "$OUT/sitemap.xml"
cp -R "$ROOT/app/public/assets" "$OUT/assets"
cat > "$OUT/config.js" <<EOF
window.MALACHI_API_BASE = '$API_BASE';
EOF
node <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.OUT;
const api = process.env.API_BASE.replace(/\/$/, '');

for (const name of fs.readdirSync(root).filter((file) => file.endsWith('.html'))) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, 'utf8');
  const replacements = new Map([
    ['href="/style.css"', 'href="style.css"'],
    ['src="/config.js"', 'src="config.js"'],
    ['src="/app.js"', 'src="app.js"'],
    ['src="/dashboard.js"', 'src="dashboard.js"'],
    ['src="/accessibility.js"', 'src="accessibility.js"'],
    ['href="/"', 'href="index.html"'],
    ['href="/index.html"', 'href="index.html"'],
    ['href="/demo-ai.html"', 'href="demo-ai.html"'],
    ['href="/onboarding.html"', 'href="onboarding.html"'],
    ['href="/faq.html"', 'href="faq.html"'],
    ['href="/privacy.html"', 'href="privacy.html"'],
    ['href="/terms.html"', 'href="terms.html"'],
    ['href="/data-deletion.html"', 'href="data-deletion.html"'],
    ['href="/accessibility.html"', 'href="accessibility.html"'],
    ['href="/create-user.html"', `href="${api}/create-user.html"`],
    ['href="/login.html"', `href="${api}/login.html"`],
    ['href="/dashboard.html"', `href="${api}/dashboard.html"`],
    ['href="/feedback.html"', `href="${api}/feedback.html"`],
    ['href="/status.html"', `href="${api}/status.html"`],
    ['href="/manager.html"', `href="${api}/manager.html"`],
    ['/assets/brand/malachi-mascot.png', '/assets/brand/malachi-mascot-180.png'],
    ['src="/assets/', 'src="assets/'],
    ['href="/assets/', 'href="assets/']
  ]);
  for (const [from, to] of replacements) html = html.replaceAll(from, to);
  fs.writeFileSync(file, html);
}
JS
printf '%s\n' "$OUT"
