#!/usr/bin/env bash
# Canonical AISTROYKA live AI provider gate (apps/web / Cloudflare — NOT Python backend).
#
# Proves live provider execution via:
#   1) Remote POST /api/v1/ai/analyze-image without X-AI-Fallback-Reason (preferred), or
#   2) Minimal direct OpenAI chat completion when OPENAI_API_KEY is set locally (never printed).
#
# Usage:
#   ./scripts/smoke/ai_live_provider.sh
#   ./scripts/smoke/ai_live_provider.sh --require-live
#
# Env:
#   BASE_URL          — deployed app (default https://aistroyka.ai)
#   IMAGE_URL         — public https image for vision probe
#   AUTH_HEADER       — optional Bearer for tenant-scoped checks
#   SMOKE_EMAIL/SMOKE_PASSWORD/SUPABASE_URL/SUPABASE_ANON_KEY — mint JWT
#   OPENAI_API_KEY    — optional local direct probe (loaded from .env.pilot / .env.local if unset)
#   OPENAI_COPILOT_MODEL — direct probe model (default gpt-4o-mini)
set -euo pipefail

REQUIRE_LIVE=0
if [[ "${1:-}" == "--require-live" ]]; then
  REQUIRE_LIVE=1
elif [[ -n "${1:-}" ]]; then
  echo "ai_live_provider: unknown arg $1 (use --require-live)" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=_json_lib.sh
source "$REPO_ROOT/scripts/smoke/_json_lib.sh"
cd "$REPO_ROOT"

BASE="${BASE_URL:-https://aistroyka.ai}"
IMAGE_URL="${IMAGE_URL:-https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=70}"
DIRECT_MODEL="${OPENAI_COPILOT_MODEL:-gpt-4o-mini}"

# --- env helpers (never print secret values) ---
read_env_value() {
  local name="$1"
  local f val
  if [[ -n "${!name:-}" ]]; then
    printf '%s' "${!name}"
    return 0
  fi
  for f in "$REPO_ROOT/.env.pilot" "$REPO_ROOT/.env.local" "$REPO_ROOT/apps/web/.env.local"; do
    [[ -f "$f" ]] || continue
    val="$(grep -E "^${name}=" "$f" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' || true)"
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    if [[ -n "${val//[[:space:]]/}" ]]; then
      printf '%s' "$val"
      return 0
    fi
  done
  return 1
}

key_len() {
  local v
  v="$(read_env_value "$1" 2>/dev/null || true)"
  printf '%d' "${#v}"
}

provider_configured=false
missing_key_count=0
if [[ "$(key_len OPENAI_API_KEY)" -gt 0 ]] \
  || [[ "$(key_len ANTHROPIC_API_KEY)" -gt 0 ]] \
  || [[ "$(key_len GOOGLE_AI_API_KEY)" -gt 0 ]] \
  || [[ "$(key_len GEMINI_API_KEY)" -gt 0 ]]; then
  provider_configured=true
else
  missing_key_count=1
fi

live_provider_call_attempted=false
live_provider_call_succeeded=false
fallback_count=0
llm_success_count=0
provider_used=""
model_used=""
error_kind=""

bool_json() {
  [[ "$1" == true ]] && echo true || echo false
}

emit_json() {
  local fb_rate="0"
  if [[ "$live_provider_call_attempted" == true && "$llm_success_count" -eq 0 ]]; then
    fb_rate="100"
  elif [[ "$fallback_count" -gt 0 && "$llm_success_count" -gt 0 ]]; then
    fb_rate="50"
  fi
  if smoke_have_jq; then
    jq -n \
      --argjson provider_configured "$(bool_json "$provider_configured")" \
      --argjson live_provider_call_attempted "$(bool_json "$live_provider_call_attempted")" \
      --argjson live_provider_call_succeeded "$(bool_json "$live_provider_call_succeeded")" \
      --argjson llm_success_count "$llm_success_count" \
      --argjson fallback_count "$fallback_count" \
      --argjson missing_key_count "$missing_key_count" \
      --arg fallback_rate "$fb_rate" \
      --arg provider "$provider_used" \
      --arg model "$model_used" \
      --arg error_kind "$error_kind" \
      --arg canonical_gate "scripts/smoke/ai_live_provider.sh" \
      --arg runtime "apps/web/cloudflare_workers" \
      '{
        canonical_gate: $canonical_gate,
        runtime: $runtime,
        provider_configured: $provider_configured,
        live_provider_call_attempted: $live_provider_call_attempted,
        live_provider_call_succeeded: $live_provider_call_succeeded,
        llm_success_count: $llm_success_count,
        fallback_count: $fallback_count,
        missing_key_count: $missing_key_count,
        fallback_rate: ($fallback_rate + "%"),
        provider: (if $provider == "" then null else $provider end),
        model: (if $model == "" then null else $model end),
        error_kind: (if $error_kind == "" then null else $error_kind end)
      }'
  else
    smoke_python3 -c '
import json,sys
print(json.dumps({
  "canonical_gate": "scripts/smoke/ai_live_provider.sh",
  "runtime": "apps/web/cloudflare_workers",
  "provider_configured": sys.argv[1] == "true",
  "live_provider_call_attempted": sys.argv[2] == "true",
  "live_provider_call_succeeded": sys.argv[3] == "true",
  "llm_success_count": int(sys.argv[4]),
  "fallback_count": int(sys.argv[5]),
  "missing_key_count": int(sys.argv[6]),
  "fallback_rate": sys.argv[7] + "%",
  "provider": sys.argv[8] or None,
  "model": sys.argv[9] or None,
  "error_kind": sys.argv[10] or None,
}))
' "$provider_configured" "$live_provider_call_attempted" "$live_provider_call_succeeded" \
      "$llm_success_count" "$fallback_count" "$missing_key_count" "$fb_rate" \
      "$provider_used" "$model_used" "$error_kind"
  fi
}

# --- remote health (optional signal) ---
health_openai=false
if command -v curl &>/dev/null; then
  HEALTH_JSON="$(curl -sS -m 15 "${BASE}/api/v1/health" 2>/dev/null || true)"
  if [[ -n "$HEALTH_JSON" ]]; then
    HEALTH_FILE="$(mktemp)"
    printf '%s' "$HEALTH_JSON" >"$HEALTH_FILE"
    if smoke_json_get_bool "$HEALTH_FILE" "openaiConfigured"; then
      health_openai=true
      if [[ "$provider_configured" == false ]]; then
        provider_configured=true
        missing_key_count=0
      fi
    fi
    rm -f "$HEALTH_FILE"
  fi
fi

# --- remote vision probe ---
remote_vision_probe() {
  local code fb hdr body
  body="$(mktemp)"
  hdr="$(mktemp)"
  trap 'rm -f "$body" "$hdr"' RETURN
  live_provider_call_attempted=true
  provider_used="openai"
  model_used="${OPENAI_VISION_MODEL:-gpt-4o-mini}"

  if [[ -n "${AUTH_HEADER:-}" ]]; then
    code=$(curl -sS --location-trusted -D "$hdr" -o "$body" -w "%{http_code}" -m 90 \
      -H "Authorization: $AUTH_HEADER" -H "Content-Type: application/json" \
      -X POST "${BASE}/api/v1/ai/analyze-image" \
      --data-binary "{\"image_url\":\"${IMAGE_URL}\"}" 2>/dev/null || echo "000")
  else
    code=$(curl -sS --location-trusted -D "$hdr" -o "$body" -w "%{http_code}" -m 90 \
      -H "Content-Type: application/json" \
      -X POST "${BASE}/api/v1/ai/analyze-image" \
      --data-binary "{\"image_url\":\"${IMAGE_URL}\"}" 2>/dev/null || echo "000")
  fi

  if [[ "$code" == "503" ]]; then
    error_kind="provider_unavailable"
    fallback_count=1
    return 1
  fi
  if [[ "$code" != "200" ]]; then
    error_kind="http_${code}"
    fallback_count=1
    return 1
  fi

  fb=$(awk -F': ' 'BEGIN{IGNORECASE=1} $1=="x-ai-fallback-reason"{print $2}' "$hdr" | tr -d '\r' | head -1)
  if [[ -n "$fb" ]]; then
    fallback_count=1
    error_kind="$fb"
    return 1
  fi

  if smoke_assert_analysis_result "$body" 2>/dev/null || smoke_python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("risk_level") and d.get("stage") else 1)' "$body"; then
    llm_success_count=1
    live_provider_call_succeeded=true
    provider_used="vision_router"
    return 0
  fi
  error_kind="invalid_response_body"
  fallback_count=1
  return 1
}

# --- direct OpenAI probe (local key only) ---
direct_openai_probe() {
  local key resp code
  key="$(read_env_value OPENAI_API_KEY 2>/dev/null || true)"
  [[ -n "$key" ]] || return 1
  live_provider_call_attempted=true
  provider_used="openai"
  model_used="$DIRECT_MODEL"

  resp="$(mktemp)"
  trap 'rm -f "$resp"' RETURN
  code=$(curl -sS -m 45 -o "$resp" -w "%{http_code}" \
    https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer ${key}" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"${DIRECT_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly: ok\"}],\"max_tokens\":5}" 2>/dev/null || echo "000")

  if [[ "$code" == "200" ]] && smoke_python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("choices") and d["choices"][0].get("message",{}).get("content") else 1)' "$resp" 2>/dev/null; then
    llm_success_count=1
    live_provider_call_succeeded=true
    return 0
  fi
  fallback_count=1
  if [[ "$code" == "429" ]]; then
    error_kind="rate_limit"
  elif [[ "$code" == "401" ]]; then
    error_kind="auth_failed"
  else
    error_kind="openai_http_${code}"
  fi
  return 1
}

# Mint auth if needed for remote (optional)
if [[ -z "${AUTH_HEADER:-}" && -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
  SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
  if [[ -n "$SUPA_URL" && -n "$SUPA_KEY" ]]; then
    TOKEN_RESP=$(curl -sSL -m 15 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
      -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
      --data-binary "{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}" 2>/dev/null || true)
    TOKEN=$(printf '%s' "$TOKEN_RESP" | smoke_jq -r '.access_token // empty')
    [[ -n "$TOKEN" ]] && AUTH_HEADER="Bearer $TOKEN"
  fi
fi

# Probe order: remote vision (production truth), then direct OpenAI
if command -v curl &>/dev/null; then
  remote_vision_probe || true
fi
if [[ "$live_provider_call_succeeded" != true ]]; then
  direct_openai_probe || true
fi

emit_json

if [[ "$REQUIRE_LIVE" -eq 1 ]]; then
  if [[ "$live_provider_call_succeeded" == true && "$llm_success_count" -ge 1 ]]; then
    echo "ai_live_provider: verdict GO — live provider call succeeded" >&2
    exit 0
  fi
  echo "ai_live_provider: verdict NO-GO — require-live not satisfied (configured=$provider_configured health_openai=$health_openai error_kind=${error_kind:-none})" >&2
  exit 1
fi

echo "ai_live_provider: verdict CONDITIONAL — summary emitted (pass --require-live for strict gate)" >&2
exit 0
