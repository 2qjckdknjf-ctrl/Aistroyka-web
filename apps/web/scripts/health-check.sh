#!/usr/bin/env bash
# Usage: ./scripts/health-check.sh [BASE_URL]
# Example: ./scripts/health-check.sh https://your-app.com
# Exit 0 if GET /api/health returns ok:true and (optional) aiConfigured:true; non-zero otherwise.

set -e
BASE="${1:-http://localhost:3000}"
URL="${BASE%/}/api/health"

echo "Checking $URL ..."
RESP="$(curl -sS -w '\n%{http_code}' "$URL")"
HTTP_CODE="$(echo "$RESP" | tail -n1)"
BODY="$(echo "$RESP" | sed '$d')"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Health check failed: HTTP $HTTP_CODE"
  echo "$BODY"
  if echo "$BODY" | grep -q "missing_supabase_env"; then
    echo ""
    echo "→ Backend needs Supabase env. Run: cp .env.local.example .env.local && edit .env.local (set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  fi
  exit 1
fi

if ! echo "$BODY" | grep -q '"ok"\s*:\s*true'; then
  echo "Health check failed: ok is not true"
  echo "$BODY"
  exit 1
fi

echo "OK: $BODY"
exit 0
