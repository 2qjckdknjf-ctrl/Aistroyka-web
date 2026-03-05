#!/usr/bin/env bash
# Smoke matrix: health, sync, upload session create/finalize, job process, ai analyze (gated), rate-limit.
# Usage: BASE_URL=https://staging.example.com ./scripts/smoke-v1.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"

echo "Smoke v1: $BASE"
curl -sf "${BASE}/api/v1/health" | jq -e '.ok == true' && echo "  health ok" || { echo "  health fail"; exit 1; }
echo "  (sync/bootstrap and upload/job/ai require auth; run with token for full smoke)"
