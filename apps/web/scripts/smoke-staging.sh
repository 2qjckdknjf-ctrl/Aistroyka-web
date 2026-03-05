#!/usr/bin/env bash
# Smoke check for staging. Usage: ./scripts/smoke-staging.sh [base_url]
# Default base_url: https://staging.aistroyka.ai (or set SMOKE_BASE_URL)
set -e
BASE="${1:-${SMOKE_BASE_URL:-https://staging.aistroyka.ai}}"
echo "Smoke check: $BASE"
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 "$BASE/api/v1/health")
if [[ "$code" != "200" && "$code" != "503" ]]; then
  echo "FAIL: GET $BASE/api/v1/health → HTTP $code"
  exit 1
fi
body=$(curl -sS -m 15 "$BASE/api/v1/health")
if echo "$body" | grep -q '"env":"staging"'; then
  echo "PASS: health env=staging"
else
  echo "WARN: health response may not include env=staging (OK if workers.dev only)"
fi
echo "PASS: staging smoke ($BASE)"
exit 0
