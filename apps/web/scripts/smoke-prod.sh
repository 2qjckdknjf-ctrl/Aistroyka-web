#!/usr/bin/env bash
# Smoke check for production. Usage: ./scripts/smoke-prod.sh [base_url]
# Default base_url: https://aistroyka.ai (or set SMOKE_BASE_URL)
set -e
BASE="${1:-${SMOKE_BASE_URL:-https://aistroyka.ai}}"
echo "Smoke check: $BASE"
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 -L "$BASE/api/v1/health")
if [[ "$code" != "200" && "$code" != "503" ]]; then
  echo "FAIL: GET $BASE/api/v1/health → HTTP $code"
  exit 1
fi
body=$(curl -sS -m 15 -L "$BASE/api/v1/health")
if echo "$body" | grep -q '"ok"'; then
  echo "PASS: health returns JSON with ok"
else
  echo "FAIL: health response invalid"
  exit 1
fi
echo "PASS: production smoke ($BASE)"
exit 0
