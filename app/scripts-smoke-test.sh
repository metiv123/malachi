#!/usr/bin/env sh
set -eu
BASE="${1:-http://localhost:8787}"
for path in / /faq.html /admin.html /api/health /api/readiness /api/meta/readiness /api/version; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  echo "$path $code"
  test "$code" = "200"
done
