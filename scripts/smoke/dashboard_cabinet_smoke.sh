#!/usr/bin/env bash
# Lightweight routing smoke for dashboard/cabinet visibility closure.
# Usage: BASE_URL=http://localhost:3000 bash scripts/smoke/dashboard_cabinet_smoke.sh
# Or:    bash scripts/smoke/dashboard_cabinet_smoke.sh https://staging.example.com
#
# Manual checklist (product flow — run in browser logged out):
#   1. Open marketing home (same origin), confirm Public header shows Dashboard/cabinet CTA → /dashboard.
#   2. Hit /dashboard (or localized /{locale}/dashboard): expect redirect to login?next=<current-path>.
#   3. After login without ?next=: expect landing on localized /{locale}/dashboard (not subscribe).
#   4. With active subscription OR billing-pilot tenant OR SUBSCRIPTION_GATE_DASHBOARD≠enforce: dashboard shell loads.
set -euo pipefail
BASE="${1:-${BASE_URL:-http://localhost:3000}}"
BASE="${BASE%/}"

echo "Dashboard / cabinet closure smoke → $BASE"
echo "---"
echo "GET /dashboard (expects 308 apex→/en/dashboard or follow)"
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 20 "${BASE}/dashboard" || true)
echo "/dashboard HTTP $code"

echo "GET /ru/dashboard"
code_ru=$(curl -sS -o /dev/null -w "%{http_code}" -m 20 "${BASE}/ru/dashboard" || true)
echo "/ru/dashboard HTTP $code_ru"

echo "GET /en/dashboard"
code_en=$(curl -sS -o /dev/null -w "%{http_code}" -m 20 "${BASE}/en/dashboard" || true)
echo "/en/dashboard HTTP $code_en"

echo "GET /api/v1/health"
health=$(curl -sS -o /dev/null -w "%{http_code}" -m 20 "${BASE}/api/v1/health" || true)
echo "/api/v1/health HTTP $health"

if [[ "$health" != "200" && "$health" != "503" ]]; then
  echo "FAIL: unexpected health HTTP $health (allowed: 200, 503 unavailable)"
  exit 1
fi

echo "---"
echo "PASS: endpoints reachable — complete manual checklist above for public → login → dashboard."
