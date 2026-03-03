#!/usr/bin/env bash
# Verify production /api/health after deploy.
# Exits 0 only if: status 200, sha7 != 0e363e4, serviceRoleConfigured present, supabaseReachable === true.
set -euo pipefail

URL="${1:-https://aistroyka.ai/api/health}"
OLD_SHA7="0e363e4"

echo "GET $URL"
res=$(curl -sS -w "\n%{http_code}" "$URL")
body=$(echo "$res" | sed '$d')
code=$(echo "$res" | tail -1)

echo "HTTP $code"
echo "$body" | jq . 2>/dev/null || echo "$body"

if [[ "$code" != "200" ]]; then
  echo "FAIL: expected HTTP 200, got $code"
  exit 1
fi

sha7=$(echo "$body" | jq -r '.buildStamp.sha7 // empty')
if [[ "$sha7" == "$OLD_SHA7" ]]; then
  echo "FAIL: buildStamp.sha7 is still $OLD_SHA7 (old deploy); expected new SHA after push"
  exit 1
fi

if [[ -z "$sha7" ]]; then
  echo "FAIL: buildStamp.sha7 missing"
  exit 1
fi

has_svc=$(echo "$body" | jq 'has("serviceRoleConfigured")')
if [[ "$has_svc" != "true" ]]; then
  echo "FAIL: response does not include serviceRoleConfigured"
  exit 1
fi

supabase_ok=$(echo "$body" | jq -r '.supabaseReachable')
if [[ "$supabase_ok" != "true" ]]; then
  echo "FAIL: supabaseReachable expected true, got $supabase_ok"
  exit 1
fi

echo "PASS: sha7=$sha7, serviceRoleConfigured present, supabaseReachable=true"
exit 0
