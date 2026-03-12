#!/usr/bin/env bash
# Dashboard route smoke: health + /dashboard and /ru/dashboard must not return 500.
# Usage:
#   BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/dashboard_smoke.sh
#   BASE_URL=http://localhost:3000 bash apps/web/scripts/smoke/dashboard_smoke.sh
set -e
BASE="${BASE_URL:-http://localhost:3000}"
FAIL=0

echo "Dashboard smoke: $BASE"

# 1) Health
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 "$BASE/api/v1/health" || true)
if [[ "$code" != "200" && "$code" != "503" ]]; then
  echo "  FAIL: GET /api/v1/health → HTTP $code"
  FAIL=1
else
  echo "  PASS: health → $code"
fi

# 2) /dashboard (no locale) → expect 308 redirect to /en/dashboard or 200
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 -L "$BASE/dashboard" || true)
if [[ "$code" == "500" ]]; then
  echo "  FAIL: GET /dashboard → HTTP 500 (server error)"
  FAIL=1
elif [[ "$code" -ge 200 && "$code" -lt 400 ]]; then
  echo "  PASS: /dashboard → $code"
else
  echo "  WARN: /dashboard → $code"
fi

# 3) /ru/dashboard → expect 200 (with session) or 302/307 to login (no session), never 500
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 "$BASE/ru/dashboard" || true)
if [[ "$code" == "500" ]]; then
  echo "  FAIL: GET /ru/dashboard → HTTP 500 (server error)"
  FAIL=1
elif [[ "$code" -ge 300 && "$code" -lt 400 ]]; then
  echo "  PASS: /ru/dashboard → $code (redirect to login or similar)"
elif [[ "$code" -ge 200 && "$code" -lt 300 ]]; then
  echo "  PASS: /ru/dashboard → $code"
else
  echo "  WARN: /ru/dashboard → $code"
fi

if [[ $FAIL -eq 1 ]]; then
  echo "Dashboard smoke: FAILED"
  exit 1
fi
echo "Dashboard smoke: PASSED"
exit 0
