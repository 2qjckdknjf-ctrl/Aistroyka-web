#!/usr/bin/env bash
# Copilot SSE smoke — requires tenant auth and OPENAI configured on server.
#
# Usage:
#   BASE_URL=https://staging.aistroyka.ai \
#   AUTH_HEADER="Bearer <jwt>" \
#   PROJECT_ID=<uuid> \
#   ./scripts/smoke/ai_copilot_stream.sh
#
# Or mint token:
#   SMOKE_EMAIL=... SMOKE_PASSWORD=... SUPABASE_URL=... SUPABASE_ANON_KEY=... \
#   BASE_URL=... PROJECT_ID=... ./scripts/smoke/ai_copilot_stream.sh
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
    TOKEN=$(printf '%s' "$TOKEN_RESP" | smoke_jq -r '.access_token // empty')
    [[ -n "$TOKEN" ]] && echo "Bearer $TOKEN"
  fi
}

if [[ -z "$AUTH" ]]; then
  MINTED="$(mint_smoke_token_if_possible || true)"
  [[ -n "$MINTED" ]] && AUTH="$MINTED"
fi

if [[ -z "$AUTH" ]]; then
  echo "ai_copilot_stream: need AUTH_HEADER or SMOKE_EMAIL+SMOKE_PASSWORD+SUPABASE_URL+SUPABASE_ANON_KEY" >&2
  exit 2
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "ai_copilot_stream: PROJECT_ID required" >&2
  exit 2
fi

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

curl -sS --location-trusted -N -m 90 \
  -H "Authorization: $AUTH" \
  -H "Content-Type: application/json" \
  -X POST "$BASE/api/v1/projects/$PROJECT_ID/copilot/chat/stream" \
  --data-binary '{"thread_id":null,"user_text":"Smoke: list top project risks in one sentence.","decision_context":{"overall_risk":0.2,"confidence":0.6,"top_risk_factors":[{"name":"overdue_tasks"}],"projected_delay_date":null,"velocity_trend":"down","anomalies":[],"aggregated_at":"2026-06-04T00:00:00.000Z"},"locale":"en"}' \
  >"$TMP" || true

if ! tr -d '\r' <"$TMP" | grep -q '^event: meta$'; then
  echo "ai_copilot_stream: missing event: meta" >&2
  head -c 800 "$TMP" >&2 || true
  exit 1
fi

if ! tr -d '\r' <"$TMP" | grep -q '^event: done$'; then
  echo "ai_copilot_stream: missing terminal event: done (may be 503 OpenAI or admin client)" >&2
  head -c 800 "$TMP" >&2 || true
  exit 1
fi

if tr -d '\r' <"$TMP" | grep -q 'fallback_reason'; then
  echo "ai_copilot_stream: OK (completed with fallback — check provider quota/keys on server)"
else
  echo "ai_copilot_stream: OK (done, no fallback_reason in payload)"
fi
