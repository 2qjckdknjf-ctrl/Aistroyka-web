#!/usr/bin/env bash
# Verify production auth/config by calling /api/health and /api/auth/diag.
# Prints only non-sensitive fields. Exits non-zero if required config is missing (e.g. anonKeyPresent=false).
set -e

BASE_URL="${BASE_URL:-https://aistroyka.ai}"

echo "=== Health ==="
health=$(curl -sS "${BASE_URL}/api/health" || true)
echo "$health"
if ! echo "$health" | grep -q '"ok":\s*true'; then
  echo "Health check failed or not JSON with ok:true"
  exit 1
fi

echo ""
echo "=== Auth diag (non-sensitive) ==="
diag=$(curl -sS "${BASE_URL}/api/auth/diag" || true)
echo "$diag"
if ! echo "$diag" | grep -q '"anonKeyPresent":\s*true'; then
  echo "anonKeyPresent is not true; set NEXT_PUBLIC_SUPABASE_* in Cloudflare Worker Variables (see docs/CLOUDFLARE_WORKER_VARS.md)"
  exit 1
fi

echo ""
echo "OK: health and auth diag passed; anon key present."
