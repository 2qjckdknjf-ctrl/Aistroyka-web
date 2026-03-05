#!/usr/bin/env bash
# Push smoke: enqueue test push via admin, run jobs/process to drain outbox.
# Usage: BASE_URL=... AUTH=<admin-bearer-token> [CRON_SECRET=...] ./scripts/mobile/smoke-push.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH:-}"
H="${AUTH_HEADER:-}"
if [ -n "$AUTH" ] && [ -z "$H" ]; then
  H="Authorization: Bearer $AUTH"
fi
CRON_SECRET="${CRON_SECRET:-}"

echo "Push smoke: $BASE"
if [ -z "$H" ]; then
  echo "  (no AUTH; skip)"
  exit 0
fi

# Enqueue a test push (admin)
ENQ=$(curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" \
  -d '{"platform":"ios","type":"job_done"}' "${BASE}/api/v1/admin/push/test" 2>/dev/null || true)
if ! echo "$ENQ" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "  admin push/test failed (need admin auth): $ENQ"
  exit 1
fi
echo "  push enqueued"

# Drain outbox via jobs/process (requires cron secret if REQUIRE_CRON_SECRET=true)
EXTRA_HEADERS=""
if [ -n "$CRON_SECRET" ]; then
  EXTRA_HEADERS="-H x-cron-secret: $CRON_SECRET"
fi
JOBS=$(curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" $EXTRA_HEADERS "${BASE}/api/v1/jobs/process?limit=10" 2>/dev/null || true)
if ! echo "$JOBS" | jq -e '.processed >= 0' >/dev/null 2>&1; then
  echo "  jobs/process failed (check CRON_SECRET if required): $JOBS"
  exit 1
fi
echo "  jobs/process ok (processed: $(echo "$JOBS" | jq -r '.processed'))"
echo "  push smoke done"
