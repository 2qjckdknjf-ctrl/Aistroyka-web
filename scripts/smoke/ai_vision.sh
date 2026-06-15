#!/usr/bin/env bash
# Vision analyze-image smoke — accepts 200 full model or 200 deterministic fallback.
#
# Usage:
#   BASE_URL=... AUTH_HEADER="Bearer ..." ./scripts/smoke/ai_vision.sh
# Optional: PROJECT_ID=... IMAGE_URL=...
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH_HEADER:-}"
PROJECT_ID="${PROJECT_ID:-}"
IMAGE_URL="${IMAGE_URL:-https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=70}"

mint_smoke_token_if_possible() {
  SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
  if [[ -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" && -n "$SUPA_URL" && -n "$SUPA_KEY" ]]; then
    TOKEN_RESP=$(curl -sSL -m 15 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
      -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
      --data-binary "{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}" 2>/dev/null || true)
    if command -v jq &>/dev/null; then
      TOKEN=$(printf '%s' "$TOKEN_RESP" | jq -r '.access_token // empty' 2>/dev/null)
      [[ -n "$TOKEN" ]] && echo "Bearer $TOKEN"
    fi
  fi
}

if [[ -z "$AUTH" ]]; then
  M="$(mint_smoke_token_if_possible || true)"
  [[ -n "$M" ]] && AUTH="$M"
fi

if [[ -z "$AUTH" ]]; then
  echo "ai_vision: need AUTH_HEADER or SMOKE_EMAIL+SMOKE_PASSWORD+SUPABASE_*" >&2
  exit 2
fi

if ! command -v jq &>/dev/null; then
  echo "ai_vision: jq required" >&2
  exit 2
fi

TMPHDR=$(mktemp)
TMPBODY=$(mktemp)
trap 'rm -f "$TMPHDR" "$TMPBODY"' EXIT

payload="{\"image_url\":\"$IMAGE_URL\""
[[ -n "$PROJECT_ID" ]] && payload="${payload}, \"project_id\": \"$PROJECT_ID\""
payload="${payload}}"

code=$(curl -sS -D "$TMPHDR" -o "$TMPBODY" -w "%{http_code}" -m 90 \
  -H "Authorization: $AUTH" -H "Content-Type: application/json" \
  -X POST "$BASE/api/v1/ai/analyze-image" \
  --data-binary "$payload" || true)

if [[ "$code" == "503" ]]; then
  echo "ai_vision: BLOCKED — no vision provider configured on server (503)" >&2
  exit 3
fi

if [[ "$code" != "200" ]]; then
  echo "ai_vision: expected 200, got $code" >&2
  head -c 400 "$TMPBODY" >&2 || true
  exit 1
fi

jq -e '.risk_level and .stage and (.completion_percent|type=="number")' "$TMPBODY" >/dev/null \
  || { echo "ai_vision: invalid AnalysisResult body" >&2; cat "$TMPBODY" >&2; exit 1; }

fb=$(awk -F': ' 'BEGIN{IGNORECASE=1} $1=="x-ai-fallback-reason"{print $2}' "$TMPHDR" | tr -d '\r')
if [[ -n "$fb" ]]; then
  echo "ai_vision: OK (fallback=$fb)"
else
  echo "ai_vision: OK (live vision path)"
fi
