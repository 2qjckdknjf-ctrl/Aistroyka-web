#!/usr/bin/env bash
# Pilot verification: health, ops/metrics (optional), cron-tick (optional).
# Usage:
#   BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/pilot.sh
#   BASE_URL=... AUTH_HEADER="Bearer <token>" bash apps/web/scripts/smoke/pilot.sh   # + ops/metrics
#   BASE_URL=... CRON_SECRET=... bash apps/web/scripts/smoke/pilot.sh               # + cron-tick
set -e
BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH_HEADER:-}"
CRON="${CRON_SECRET:-}"
FAIL=0

echo "Pilot smoke: $BASE"

# 1) Health (no auth)
code=$(curl -sS -o /tmp/pilot_health.json -w "%{http_code}" -m 15 "$BASE/api/v1/health" || true)
if [[ "$code" != "200" && "$code" != "503" ]]; then
  echo "  FAIL: GET /api/v1/health → HTTP $code"
  FAIL=1
else
  if grep -q '"ok"' /tmp/pilot_health.json 2>/dev/null; then
    echo "  PASS: health"
  else
    echo "  FAIL: health response missing ok"
    FAIL=1
  fi
fi

# 2) Ops metrics (tenant-scoped; requires auth)
if [[ -n "$AUTH" ]]; then
  code=$(curl -sS -o /tmp/pilot_metrics.json -w "%{http_code}" -m 15 -H "Authorization: $AUTH" "$BASE/api/v1/ops/metrics" || true)
  if [[ "$code" == "200" ]]; then
    echo "  PASS: ops/metrics"
  else
    echo "  SKIP/WARN: ops/metrics → HTTP $code (auth may be required)"
  fi
else
  echo "  SKIP: ops/metrics (no AUTH_HEADER)"
fi

# 3) Cron tick (requires x-cron-secret when REQUIRE_CRON_SECRET=true)
if [[ -n "$CRON" ]]; then
  code=$(curl -sS -o /tmp/pilot_cron.json -w "%{http_code}" -m 30 -X POST -H "Content-Type: application/json" -H "x-cron-secret: $CRON" "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [[ "$code" == "200" ]]; then
    echo "  PASS: cron-tick"
  elif [[ "$code" == "403" ]]; then
    echo "  WARN: cron-tick 403 (check REQUIRE_CRON_SECRET / CRON_SECRET)"
  else
    echo "  WARN: cron-tick → HTTP $code"
  fi
else
  echo "  SKIP: cron-tick (no CRON_SECRET)"
fi

if [[ $FAIL -eq 1 ]]; then
  exit 1
fi
echo "  pilot smoke done"
exit 0
