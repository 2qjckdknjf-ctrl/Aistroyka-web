#!/usr/bin/env bash
# Phase 7.7.1 — Pilot launch one-command verification.
# Calls cron-tick (with x-cron-secret when CRON_SECRET set), ops/metrics (with from/to), prints key counters.
# Exits non-zero if any endpoint fails.
#
# Usage:
#   BASE_URL=http://localhost:3000 ./scripts/smoke/pilot_launch.sh
#   CRON_SECRET=xxx BASE_URL=... ./scripts/smoke/pilot_launch.sh          # cron-tick when REQUIRE_CRON_SECRET=true
#   COOKIE="sb-...=..." BASE_URL=... ./scripts/smoke/pilot_launch.sh      # ops/metrics tenant-scoped (session cookie)
#   AUTH_HEADER="Bearer <token>" BASE_URL=... ./scripts/smoke/pilot_launch.sh  # or use Authorization header for metrics
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
CRON="${CRON_SECRET:-}"
AUTH="${AUTH_HEADER:-}"
COOKIE="${COOKIE:-}"
FAIL=0

# Default from/to: last 7 days to today (portable date)
TO=$(date -u +%Y-%m-%d)
if date -u -v-7d +%Y-%m-%d &>/dev/null; then
  FROM=$(date -u -v-7d +%Y-%m-%d)
else
  FROM=$(date -u -d '7 days ago' +%Y-%m-%d)
fi

echo "Pilot launch smoke: $BASE (from=$FROM to=$TO)"

# 1) POST /api/v1/admin/jobs/cron-tick (x-cron-secret when CRON_SECRET set or when required by server)
if [[ -n "$CRON" ]]; then
  code=$(curl -sS -o /tmp/pilot_cron.json -w "%{http_code}" -m 30 -X POST \
    -H "Content-Type: application/json" -H "x-cron-secret: $CRON" \
    "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [[ "$code" == "200" ]]; then
    if command -v jq &>/dev/null && [[ "$(jq -r '.ok // "true"' /tmp/pilot_cron.json)" != "true" ]]; then
      echo "  FAIL: cron-tick returned ok:false"
      FAIL=1
    else
      echo "  PASS: cron-tick"
    fi
  else
    echo "  FAIL: cron-tick → HTTP $code"
    FAIL=1
  fi
else
  code=$(curl -sS -o /tmp/pilot_cron.json -w "%{http_code}" -m 30 -X POST \
    -H "Content-Type: application/json" \
    "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [[ "$code" == "200" ]]; then
    if command -v jq &>/dev/null && [[ "$(jq -r '.ok // "true"' /tmp/pilot_cron.json)" != "true" ]]; then
      echo "  FAIL: cron-tick returned ok:false"
      FAIL=1
    else
      echo "  PASS: cron-tick (no secret)"
    fi
  elif [[ "$code" == "403" ]]; then
    echo "  FAIL: cron-tick 403 (set CRON_SECRET when REQUIRE_CRON_SECRET=true)"
    FAIL=1
  else
    echo "  FAIL: cron-tick → HTTP $code"
    FAIL=1
  fi
fi

# 2) GET /api/v1/ops/metrics?from=&to= (tenant-scoped; requires Cookie or Authorization)
METRICS_EXTRA=()
[[ -n "$AUTH" ]] && METRICS_EXTRA+=(-H "Authorization: $AUTH")
[[ -n "$COOKIE" ]] && METRICS_EXTRA+=(-H "Cookie: $COOKIE")
code=$(curl -sS -o /tmp/pilot_metrics.json -w "%{http_code}" -m 15 \
  ${METRICS_EXTRA+"${METRICS_EXTRA[@]}"} \
  "$BASE/api/v1/ops/metrics?from=$FROM&to=$TO" || true)
if [[ "$code" != "200" ]]; then
  echo "  FAIL: ops/metrics → HTTP $code (set COOKIE or AUTH_HEADER for tenant auth)"
  FAIL=1
else
  echo "  PASS: ops/metrics"
  # Print key counters (jq optional)
  if command -v jq &>/dev/null; then
    echo "  Counters: uploads_stuck=$(jq -r '.uploads_stuck // "?"' /tmp/pilot_metrics.json) uploads_expired=$(jq -r '.uploads_expired // "?"' /tmp/pilot_metrics.json) devices_offline=$(jq -r '.devices_offline // "?"' /tmp/pilot_metrics.json) sync_conflicts=$(jq -r '.sync_conflicts // "?"' /tmp/pilot_metrics.json) tasks_assigned_today=$(jq -r '.tasks_assigned_today // "?"' /tmp/pilot_metrics.json) tasks_open_today=$(jq -r '.tasks_open_today // "?"' /tmp/pilot_metrics.json) tasks_completed_today=$(jq -r '.tasks_completed_today // "?"' /tmp/pilot_metrics.json)"
  else
    echo "  (install jq to print counters; raw: /tmp/pilot_metrics.json)"
  fi
fi

if [[ $FAIL -eq 1 ]]; then
  exit 1
fi
echo "  pilot_launch done"
exit 0
