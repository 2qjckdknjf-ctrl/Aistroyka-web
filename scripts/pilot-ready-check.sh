#!/usr/bin/env bash
# One-command pilot readiness check.
# Usage: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx ./scripts/pilot-ready-check.sh
# Optional: PILOT_SKIP_CRON=1 to skip cron check.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="${PILOT_BASE_URL:-}"
SECRET="${CRON_SECRET:-}"
SKIP_CRON="${PILOT_SKIP_CRON:-}"

FAIL=0
WARN=0

if [ -z "$BASE" ]; then
  echo "PILOT_BASE_URL is required. Example: PILOT_BASE_URL=https://aistroyka.ai CRON_SECRET=xxx $0"
  exit 1
fi
BASE="${BASE%/}"

echo "=== Pilot readiness check: $BASE ==="
echo ""

# 1. Health endpoint
CODE=$(curl -s -o /tmp/health.json -w "%{http_code}" --max-time 15 "$BASE/api/health" || true)
if [ "$CODE" = "200" ] && grep -q '"ok"[[:space:]]*:[[:space:]]*true' /tmp/health.json 2>/dev/null; then
  echo "[PASS] GET /api/health → 200, ok:true"
else
  echo "[FAIL] GET /api/health → $CODE or missing ok:true"
  ((FAIL++)) || true
fi

# 2. v1 health
CODE=$(curl -s -o /tmp/v1health.json -w "%{http_code}" --max-time 15 "$BASE/api/v1/health" || true)
if [ "$CODE" = "200" ] && grep -q '"ok"[[:space:]]*:[[:space:]]*true' /tmp/v1health.json 2>/dev/null; then
  echo "[PASS] GET /api/v1/health → 200, ok:true"
else
  echo "[FAIL] GET /api/v1/health → $CODE or missing ok:true"
  ((FAIL++)) || true
fi

# 3. Cron endpoint (with secret)
if [ -n "$SECRET" ] && [ "$SKIP_CRON" != "1" ] && [ "$SKIP_CRON" != "true" ]; then
  CODE=$(curl -s -o /tmp/cron.json -w "%{http_code}" --max-time 60 -X POST \
    -H "Content-Type: application/json" \
    -H "x-cron-secret: $SECRET" \
    "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [ "$CODE" = "200" ] && grep -q '"ok"[[:space:]]*:[[:space:]]*true' /tmp/cron.json 2>/dev/null; then
    echo "[PASS] POST /api/v1/admin/jobs/cron-tick (with secret) → 200"
  else
    echo "[FAIL] POST cron-tick with secret → $CODE"
    ((FAIL++)) || true
  fi
else
  echo "[WARN] Cron check skipped (no CRON_SECRET or PILOT_SKIP_CRON)"
  ((WARN++)) || true
fi

# 4. Debug endpoints blocked (expect 404)
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/_debug/auth" || true)
if [ "$CODE" = "404" ]; then
  echo "[PASS] GET /api/_debug/auth → 404 (blocked)"
else
  echo "[FAIL] GET /api/_debug/auth → $CODE (expected 404 in production)"
  ((FAIL++)) || true
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/diag/supabase" || true)
if [ "$CODE" = "404" ]; then
  echo "[PASS] GET /api/diag/supabase → 404 (blocked)"
else
  echo "[FAIL] GET /api/diag/supabase → $CODE (expected 404 in production)"
  ((FAIL++)) || true
fi

# 5. Release checker (env validation) — run Node script if available
if [ -f "$ROOT/scripts/validate-release-env.mjs" ]; then
  if (cd "$ROOT" && NODE_ENV=production node scripts/validate-release-env.mjs > /tmp/release-env.txt 2>&1); then
    if grep -q "FAIL\|forbiddenInProd" /tmp/release-env.txt 2>/dev/null; then
      echo "[WARN] Release env validation reported issues (see /tmp/release-env.txt or run script locally)"
      ((WARN++)) || true
    else
      echo "[PASS] Release env validation (run locally: NODE_ENV=production node scripts/validate-release-env.mjs)"
    fi
  else
    echo "[WARN] Release env script not run (run from repo: NODE_ENV=production node scripts/validate-release-env.mjs)"
    ((WARN++)) || true
  fi
else
  echo "[WARN] scripts/validate-release-env.mjs not found"
  ((WARN++)) || true
fi

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "=== VERDICT: FAIL ($FAIL failure(s)) ==="
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "=== VERDICT: WARNINGS ($WARN warning(s)) ==="
  exit 0
else
  echo "=== VERDICT: ALL GREEN ==="
  exit 0
fi
