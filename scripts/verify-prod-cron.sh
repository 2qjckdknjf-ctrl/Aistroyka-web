#!/usr/bin/env bash
# Verify production cron: with secret → 200; without secret → 403 or 503.
# Usage: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx ./scripts/verify-prod-cron.sh

set -e
BASE="${PILOT_BASE_URL:-}"
SECRET="${CRON_SECRET:-}"

if [ -z "$BASE" ]; then
  echo "PILOT_BASE_URL is required. Example: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx $0"
  exit 1
fi

BASE="${BASE%/}"
echo "Verifying cron at $BASE"
echo ""

# 1. With secret (expect 200)
if [ -n "$SECRET" ]; then
  CODE=$(curl -s -o /tmp/cron_with_secret.json -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "x-cron-secret: $SECRET" \
    "$BASE/api/v1/admin/jobs/cron-tick")
  if [ "$CODE" = "200" ]; then
    if grep -q '"ok"[[:space:]]*:[[:space:]]*true' /tmp/cron_with_secret.json 2>/dev/null; then
      echo "[PASS] POST cron-tick with x-cron-secret → 200, ok:true"
    else
      echo "[WARN] POST cron-tick with secret → 200 but body missing ok:true"
    fi
  else
    echo "[FAIL] POST cron-tick with secret → $CODE (expected 200)"
    cat /tmp/cron_with_secret.json 2>/dev/null || true
    exit 1
  fi
else
  echo "[WARN] CRON_SECRET not set; skipping 'with secret' check"
fi

# 2. Without secret (expect 403 or 503)
CODE=$(curl -s -o /tmp/cron_no_secret.json -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  "$BASE/api/v1/admin/jobs/cron-tick")

if [ "$CODE" = "403" ] || [ "$CODE" = "503" ]; then
  echo "[PASS] POST cron-tick without secret → $CODE (cron protected)"
else
  if [ "$CODE" = "200" ]; then
    echo "[FAIL] POST cron-tick without secret → 200 (cron should require secret in production)"
    exit 1
  else
    echo "[WARN] POST cron-tick without secret → $CODE"
  fi
fi

echo ""
echo "Cron verification done."
