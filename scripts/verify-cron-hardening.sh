#!/usr/bin/env bash
# Verify cron-tick hardening: without secret must be blocked (403 or 503).
# With secret: run manually: curl -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://your-host/api/v1/admin/jobs/cron-tick
# Requires: CRON_TICK_URL (default http://localhost:3000/api/v1/admin/jobs/cron-tick) and optionally REQUIRE_CRON_SECRET

set -e
CRON_TICK_URL="${CRON_TICK_URL:-http://localhost:3000/api/v1/admin/jobs/cron-tick}"

echo "=== Cron hardening check ==="
echo "URL: $CRON_TICK_URL"
echo ""

# 1. Without secret: must not return 2xx
echo "1. Request without x-cron-secret (must be blocked when REQUIRE_CRON_SECRET=true)..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CRON_TICK_URL" 2>/dev/null || echo "000")
if [ "$HTTP" = "403" ] || [ "$HTTP" = "503" ]; then
  echo "   PASS: Got $HTTP (cron-tick blocked without secret)"
elif [ "$HTTP" = "200" ]; then
  echo "   WARN: Got 200 without secret. If REQUIRE_CRON_SECRET=true in production, this is a misconfiguration."
  echo "   In production set REQUIRE_CRON_SECRET=true and CRON_SECRET."
else
  echo "   INFO: Got HTTP $HTTP (server may be down or REQUIRE_CRON_SECRET not set)"
fi
echo ""

# 2. With invalid secret: must be 403
echo "2. Request with invalid x-cron-secret (must be 403 when REQUIRE_CRON_SECRET=true)..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "x-cron-secret: invalid-secret" "$CRON_TICK_URL" 2>/dev/null || echo "000")
if [ "$HTTP" = "403" ]; then
  echo "   PASS: Got 403 (invalid secret rejected)"
else
  echo "   INFO: Got HTTP $HTTP"
fi
echo ""

echo "3. Manual verification with valid secret:"
echo "   curl -X POST -H \"x-cron-secret: \$CRON_SECRET\" \"$CRON_TICK_URL\""
echo "   Expect: 200 and JSON with ok: true, scheduled, processed."
echo ""
echo "See docs/release-hardening/CRON_AND_JOBS_RUNBOOK.md and CLOUDFLARE_CRON_SETUP.md"
