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
# Customer portal API must hit Route Handlers (JSON), not fall through to app not-found (HTML).
portal_ct=$(curl -sS -o /dev/null -w "%{content_type}" -m 15 "$BASE/api/v1/portal/projects")
if [[ "$portal_ct" == text/html* ]]; then
  echo "FAIL: GET $BASE/api/v1/portal/projects returned HTML ($portal_ct) — route missing from deploy bundle or misrouted"
  exit 1
fi
echo "PASS: portal projects API is not HTML ($portal_ct)"
echo "PASS: staging smoke ($BASE)"
exit 0
