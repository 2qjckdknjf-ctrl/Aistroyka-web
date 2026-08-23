#!/usr/bin/env bash
# Verify forgot-password route is deployed (not 404).
# Usage: bash scripts/pilot/verify_forgot_password_route.sh [BASE_URL]
set -euo pipefail

BASE="${1:-${BASE_URL:-https://staging.aistroyka.ai}}"
BASE="${BASE%/}"

echo "verify_forgot_password_route: $BASE"

res=$(curl -sS -o /tmp/aistroyka-fp-body.json -w "%{http_code}" \
  -X POST "$BASE/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"probe@example.com","locale":"en"}')

echo "  POST /api/v1/auth/forgot-password → HTTP $res"

case "$res" in
  404)
    echo "  NOT DEPLOYED — merge PR #229 and deploy staging"
    exit 1
    ;;
  400|200|429|503)
    echo "  ROUTE LIVE (validation/rate-limit path reachable)"
    exit 0
    ;;
  *)
    echo "  UNEXPECTED — inspect response"
    head -c 200 /tmp/aistroyka-fp-body.json 2>/dev/null || true
    echo ""
    exit 1
    ;;
esac
