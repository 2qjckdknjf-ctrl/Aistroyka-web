#!/usr/bin/env bash
# Construction intelligence smoke — GET project intelligence bundle.
#
# Usage:
#   BASE_URL=... AUTH_HEADER="Bearer ..." PROJECT_ID=<uuid> ./scripts/smoke/ai_intelligence.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_json_lib.sh
source "$SCRIPT_DIR/_json_lib.sh"

BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH_HEADER:-}"
PROJECT_ID="${PROJECT_ID:-}"

mint_smoke_token_if_possible() {
  SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
  if [[ -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" && -n "$SUPA_URL" && -n "$SUPA_KEY" ]]; then
    TOKEN_RESP=$(curl -sSL -m 15 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
      -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
      --data-binary "{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}" 2>/dev/null || true)
    printf '%s' "$TOKEN_RESP" | smoke_jq -r '.access_token // empty'
  fi
}

if [[ -z "$AUTH" ]]; then
  TOKEN="$(mint_smoke_token_if_possible || true)"
  [[ -n "$TOKEN" ]] && AUTH="Bearer $TOKEN"
fi

if [[ -z "$AUTH" || -z "$PROJECT_ID" ]]; then
  echo "ai_intelligence: need AUTH (or SMOKE_* + Supabase) and PROJECT_ID" >&2
  exit 2
fi

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

code=$(curl -sS -o "$TMP" -w "%{http_code}" -m 45 \
  -H "Authorization: $AUTH" \
  "$BASE/api/v1/projects/$PROJECT_ID/intelligence" || true)

if [[ "$code" != "200" ]]; then
  echo "ai_intelligence: expected 200, got $code" >&2
  head -c 500 "$TMP" >&2 || true
  exit 1
fi

# Minimal shape checks (deterministic bundle)
smoke_assert_intelligence_shape "$TMP" \
  || { echo "ai_intelligence: missing expected intelligence keys" >&2; cat "$TMP" >&2; exit 1; }

req=$(smoke_jq_file -r '.request_id // .requestId // empty' "$TMP" 2>/dev/null || true)
echo "ai_intelligence: OK (health + insights present${req:+, request_id=$req})"
