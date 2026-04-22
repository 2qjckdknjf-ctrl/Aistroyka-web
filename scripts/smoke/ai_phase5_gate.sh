#!/usr/bin/env bash
# Phase 5 — lightweight AI interaction SLO gate (staging/local).
# Verifies authenticated vision analyze returns 200 with a valid AnalysisResult shape
# (full model or deterministic fallback via X-AI-Fallback-Reason).
# Optionally probes copilot stream ends with event: done.
#
# Usage:
#   BASE_URL=https://staging.aistroyka.ai AUTH_HEADER="Bearer <access_token>" ./scripts/smoke/ai_phase5_gate.sh
#   BASE_URL=... SMOKE_EMAIL=... SMOKE_PASSWORD=... SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/smoke/ai_phase5_gate.sh
#   INCLUDE_STREAM=1 PROJECT_ID=<uuid> ...  # adds POST .../copilot/chat/stream minimal probe
#
# Use curl --location-trusted if your BASE_URL redirects across hosts (Authorization preserved).
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH_HEADER:-}"
COOKIE="${COOKIE:-}"
PROJECT_ID="${PROJECT_ID:-}"
INCLUDE_STREAM="${INCLUDE_STREAM:-0}"
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

if [[ -z "$AUTH" && -z "$COOKIE" ]]; then
  MINTED="$(mint_smoke_token_if_possible || true)"
  if [[ -n "$MINTED" ]]; then
    AUTH="$MINTED"
  fi
fi

# Tenant-gated routes (e.g. copilot stream) require a user JWT that passes supabase.auth.getUser().
# When smoke credentials exist, prefer a fresh password-grant token over a static bearer that may
# be metrics-only or stale (analyze-image can still return 200 fallback without a resolved user).
if [[ -z "$COOKIE" && -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
  MUSER="$(mint_smoke_token_if_possible || true)"
  if [[ -n "$MUSER" ]]; then
    AUTH="$MUSER"
  fi
fi

if [[ -z "$AUTH" && -z "$COOKIE" ]]; then
  echo "ai_phase5_gate: need AUTH_HEADER, COOKIE, or SMOKE_EMAIL+SMOKE_PASSWORD+SUPABASE_URL+SUPABASE_ANON_KEY" >&2
  exit 2
fi

EXTRA=()
[[ -n "$AUTH" ]] && EXTRA+=(-H "Authorization: $AUTH")
[[ -n "$COOKIE" ]] && EXTRA+=(-H "Cookie: $COOKIE")

TMPHDR=$(mktemp)
TMPBODY=$(mktemp)
STREAM_TMP=""
cleanup() {
  rm -f "$TMPHDR" "$TMPBODY"
  if [[ -n "${STREAM_TMP:-}" ]]; then
    rm -f "$STREAM_TMP"
  fi
  return 0
}
trap cleanup EXIT

code=$(curl -sS --location-trusted -D "$TMPHDR" -o "$TMPBODY" -w "%{http_code}" -m 60 \
  "${EXTRA[@]}" -H "Content-Type: application/json" -X POST "$BASE/api/v1/ai/analyze-image" \
  --data-binary "{\"image_url\":\"$IMAGE_URL\"${PROJECT_ID:+, \"project_id\": \"$PROJECT_ID\"}}" || true)

if [[ "$code" != "200" ]]; then
  echo "ai_phase5_gate: analyze-image expected HTTP 200, got $code" >&2
  head -c 400 "$TMPBODY" >&2 || true
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ai_phase5_gate: jq required to validate JSON body" >&2
  exit 2
fi

if ! jq -e '.risk_level and .stage and (.completion_percent|type=="number") and (.detected_issues|type=="array") and (.recommendations|type=="array")' "$TMPBODY" &>/dev/null; then
  echo "ai_phase5_gate: analyze-image body is not a valid AnalysisResult shape" >&2
  cat "$TMPBODY" >&2
  exit 1
fi

fb=$(awk -F': ' 'BEGIN{IGNORECASE=1} $1=="x-ai-fallback-reason"{print $2}' "$TMPHDR" | tr -d '\r')
if [[ -n "$fb" ]]; then
  echo "ai_phase5_gate: analyze-image OK (degraded fallback=$fb)"
else
  echo "ai_phase5_gate: analyze-image OK (full vision path)"
fi

if [[ "$INCLUDE_STREAM" == "1" ]]; then
  if [[ -z "$PROJECT_ID" ]]; then
    echo "ai_phase5_gate: INCLUDE_STREAM=1 requires PROJECT_ID" >&2
    exit 2
  fi
  STREAM_TMP=$(mktemp)
  curl -sS --location-trusted -N -m 90 "${EXTRA[@]}" -H "Content-Type: application/json" \
    -X POST "$BASE/api/v1/projects/$PROJECT_ID/copilot/chat/stream" \
    --data-binary '{"thread_id":null,"user_text":"ping","decision_context":{"overall_risk":0.1,"confidence":0.5,"top_risk_factors":[],"projected_delay_date":null,"velocity_trend":"unknown","anomalies":[],"aggregated_at":"2026-04-18T00:00:00.000Z"},"locale":null}' \
    >"$STREAM_TMP" || true
  if ! tr -d '\r' <"$STREAM_TMP" | grep -q '^event: done$'; then
    echo "ai_phase5_gate: copilot stream missing terminal done event" >&2
    head -c 600 "$STREAM_TMP" >&2 || true
    exit 1
  fi
  echo "ai_phase5_gate: copilot stream OK (done received)"
fi

exit 0
