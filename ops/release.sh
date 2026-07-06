#!/usr/bin/env sh
set -eu
if [ $# -lt 1 ]; then
  echo "Usage: ops/release.sh <version-number>" >&2
  exit 1
fi
V="$1"
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if [ ! -f "$ROOT/specs/v${V}_release_notes.md" ]; then
  cat > "$ROOT/specs/v${V}_release_notes.md" <<NOTES
# מלאכי V${V} - Release Notes

## שינוי
- TODO
NOTES
fi
python3 - <<PY
from pathlib import Path
import re,json
root=Path('$ROOT')
versions=[]
for p in sorted((root/'specs').glob('v*_release_notes.md'), key=lambda x:int(re.search(r'v(\\d+)',x.name).group(1))):
 v=int(re.search(r'v(\\d+)',p.name).group(1)); versions.append({'version':v,'file':str(p.relative_to(root)),'title':p.read_text().splitlines()[0],'zip':f'malachi-mvp-project-v{v}.zip'})
latest=max(v['version'] for v in versions)
(root/'VERSION_MANIFEST.json').write_text(json.dumps({'latest':latest,'versions':versions},ensure_ascii=False,indent=2))
(root/'VERSION_MANIFEST.md').write_text('# מלאכי - Version Manifest\\n\\n'+'\\n'.join([f"- V{v['version']}: {v['file']} -> {v['zip']}" for v in versions]))
(root/'LATEST.md').write_text(f"# מלאכי - Latest Build\\n\\nהגרסה האחרונה שנארזה: V{latest}\\n\\nקובץ ZIP אחרון: malachi-mvp-project-v{latest}.zip\\n")
PY
(cd "$ROOT/app" && npm run version:sync && npm test && npm run test:consistency)
(cd "$ROOT" && zip -r "malachi-mvp-project-v${V}.zip" README.md TODO_PRIORITY.md app specs brand marketing meta operations ops state research ROADMAP.md VERSION_MANIFEST.json VERSION_MANIFEST.md PROJECT_STATUS_V40.md LATEST.md APPROVAL_REQUIRED_NEXT_STEPS.md MALACHI_MASTER_PLAN.md DEPLOYMENT.md -x "app/data/*" "*/node_modules/*" >/tmp/malachi_release_zip.log)
echo "$ROOT/malachi-mvp-project-v${V}.zip"
