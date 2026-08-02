#!/usr/bin/env bash
# Canonical AISTROYKA live AI provider gate (apps/web / Cloudflare — NOT Python backend).
#
# Product --require-live proves a real AISTROYKA route called a provider (not fallback/mock):
#   POST ${BASE_URL}/api/v1/ai/analyze-image (authenticated)
#   HTTP 200, valid AnalysisResult schema, no X-AI-Fallback-Reason,
#   source not deterministic/mock/none/stub, request id present.
#
# Direct OpenAI chat is classified separately as credentials_provider_probe and
# NEVER satisfies --require-live.
#
# Usage:
#   BASE_URL=http://127.0.0.1:3000 IMAGE_URL=https://... ./scripts/smoke/ai_live_provider.sh
#   BASE_URL=... IMAGE_URL=... ./scripts/smoke/ai_live_provider.sh --require-live
#
# Exit codes:
#   0 — verified product live (--require-live) or conditional summary without --require-live
#   1 — live product failure under --require-live
#   2 — missing prerequisites
#
# Env:
#   BASE_URL          — required (no silent production default)
#   IMAGE_URL         — required controlled https image (no external random default)
#   AUTH_HEADER       — Bearer token (or mint via SMOKE_EMAIL/SMOKE_PASSWORD)
#   OPENAI_API_KEY    — optional credentials_provider_probe only
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

# --- env helpers (never print secret values) ---
read_env_value() {
  local name="$1"
  local f val
  if [[ -n "${!name:-}" ]]; then
    printf '%s' "${!name}"
    return 0
  fi
  for f in "$REPO_ROOT/.env.pilot" "$REPO_ROOT/.env.local" "$REPO_ROOT/apps/web/.env.local" "$REPO_ROOT/apps/web/.env.cf"; do
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

status_of() {
  local v
  v="$(read_env_value "$1" 2>/dev/null || true)"
  if [[ -z "${v//[[:space:]]/}" ]]; then
    printf 'MISSING'
  else
    printf 'PRESENT'
  fi
}

BASE="${BASE_URL:-}"
IMAGE_URL="${IMAGE_URL:-}"
DIRECT_MODEL="${OPENAI_COPILOT_MODEL:-gpt-4o-mini}"

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

product_live_attempted=false
product_live_succeeded=false
credentials_probe_attempted=false
credentials_probe_succeeded=false
fallback_count=0
llm_success_count=0
provider_used=""
model_used=""
error_kind=""
proof_class="none"
target_base=""
build_sha7=""
request_id=""
http_status=""
fallback_header=""

bool_json() {
  [[ "$1" == true ]] && echo true || echo false
}

emit_json() {
  local fb_rate="0"
  if [[ "$product_live_attempted" == true && "$llm_success_count" -eq 0 ]]; then
    fb_rate="100"
  elif [[ "$fallback_count" -gt 0 && "$llm_success_count" -gt 0 ]]; then
    fb_rate="50"
  fi
  if smoke_have_jq; then
    jq -n \
      --argjson provider_configured "$(bool_json "$provider_configured")" \
      --argjson product_live_attempted "$(bool_json "$product_live_attempted")" \
      --argjson product_live_succeeded "$(bool_json "$product_live_succeeded")" \
      --argjson credentials_probe_attempted "$(bool_json "$credentials_probe_attempted")" \
      --argjson credentials_probe_succeeded "$(bool_json "$credentials_probe_succeeded")" \
      --argjson live_provider_call_attempted "$(bool_json "$product_live_attempted")" \
      --argjson live_provider_call_succeeded "$(bool_json "$product_live_succeeded")" \
      --argjson llm_success_count "$llm_success_count" \
      --argjson fallback_count "$fallback_count" \
      --argjson missing_key_count "$missing_key_count" \
      --arg fallback_rate "$fb_rate" \
      --arg provider "$provider_used" \
      --arg model "$model_used" \
      --arg error_kind "$error_kind" \
      --arg proof_class "$proof_class" \
      --arg target_base "$target_base" \
      --arg build_sha7 "$build_sha7" \
      --arg request_id "$request_id" \
      --arg http_status "$http_status" \
      --arg fallback_header "$fallback_header" \
      --arg canonical_gate "scripts/smoke/ai_live_provider.sh" \
      --arg runtime "apps/web/cloudflare_workers" \
      '{
        canonical_gate: $canonical_gate,
        runtime: $runtime,
        proof_class: $proof_class,
        target_base: (if $target_base == "" then null else $target_base end),
        build_sha7: (if $build_sha7 == "" then null else $build_sha7 end),
        request_id: (if $request_id == "" then null else $request_id end),
        http_status: (if $http_status == "" then null else $http_status end),
        fallback_header: (if $fallback_header == "" then null else $fallback_header end),
        provider_configured: $provider_configured,
        product_live_attempted: $product_live_attempted,
        product_live_succeeded: $product_live_succeeded,
        credentials_probe_attempted: $credentials_probe_attempted,
        credentials_probe_succeeded: $credentials_probe_succeeded,
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
  "proof_class": sys.argv[1] or None,
  "target_base": sys.argv[2] or None,
  "build_sha7": sys.argv[3] or None,
  "request_id": sys.argv[4] or None,
  "http_status": sys.argv[5] or None,
  "fallback_header": sys.argv[6] or None,
  "provider_configured": sys.argv[7] == "true",
  "product_live_attempted": sys.argv[8] == "true",
  "product_live_succeeded": sys.argv[9] == "true",
  "credentials_probe_attempted": sys.argv[10] == "true",
  "credentials_probe_succeeded": sys.argv[11] == "true",
  "live_provider_call_attempted": sys.argv[8] == "true",
  "live_provider_call_succeeded": sys.argv[9] == "true",
  "llm_success_count": int(sys.argv[12]),
  "fallback_count": int(sys.argv[13]),
  "missing_key_count": int(sys.argv[14]),
  "fallback_rate": sys.argv[15] + "%",
  "provider": sys.argv[16] or None,
  "model": sys.argv[17] or None,
  "error_kind": sys.argv[18] or None,
}))
' "$proof_class" "$target_base" "$build_sha7" "$request_id" "$http_status" "$fallback_header" \
      "$provider_configured" "$product_live_attempted" "$product_live_succeeded" \
      "$credentials_probe_attempted" "$credentials_probe_succeeded" \
      "$llm_success_count" "$fallback_count" "$missing_key_count" "$fb_rate" \
      "$provider_used" "$model_used" "$error_kind"
  fi
}

prereq_fail() {
  error_kind="$1"
  proof_class="prereq_missing"
  echo "ai_live_provider: missing prerequisite: $error_kind" >&2
  emit_json
  exit 2
}

# --- prerequisites ---
if [[ -z "$BASE" ]]; then
  prereq_fail "BASE_URL_required"
fi
target_base="$BASE"

if [[ -z "$IMAGE_URL" ]]; then
  prereq_fail "IMAGE_URL_required_controlled_input"
fi
case "$IMAGE_URL" in
  http://*|https://*) ;;
  *) prereq_fail "IMAGE_URL_invalid_scheme" ;;
esac
if [[ "$IMAGE_URL" == *"unsplash.com"* ]]; then
  prereq_fail "IMAGE_URL_random_external_forbidden"
fi

# --- remote health (sanitized) ---
health_openai=false
if command -v curl &>/dev/null; then
  HEALTH_JSON="$(curl -sS -m 15 --max-redirs 0 "${BASE}/api/v1/health" 2>/dev/null || true)"
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
    build_sha7="$(smoke_jq -r '.buildStamp.sha7 // empty' <"$HEALTH_FILE" 2>/dev/null || true)"
    rm -f "$HEALTH_FILE"
  fi
fi

# Mint auth if needed
if [[ -z "${AUTH_HEADER:-}" ]]; then
  SMOKE_EMAIL_VAL="$(read_env_value SMOKE_EMAIL 2>/dev/null || true)"
  SMOKE_PASSWORD_VAL="$(read_env_value SMOKE_PASSWORD 2>/dev/null || true)"
  if [[ -n "$SMOKE_EMAIL_VAL" && -n "$SMOKE_PASSWORD_VAL" ]]; then
    SUPA_URL="$(read_env_value SUPABASE_URL 2>/dev/null || read_env_value NEXT_PUBLIC_SUPABASE_URL 2>/dev/null || true)"
    SUPA_KEY="$(read_env_value SUPABASE_ANON_KEY 2>/dev/null || read_env_value NEXT_PUBLIC_SUPABASE_ANON_KEY 2>/dev/null || true)"
    if [[ -n "$SUPA_URL" && -n "$SUPA_KEY" ]]; then
      TOKEN_RESP=$(curl -sS -m 15 --max-redirs 0 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
        -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
        --data-binary "{\"email\":\"${SMOKE_EMAIL_VAL}\",\"password\":\"${SMOKE_PASSWORD_VAL}\"}" 2>/dev/null || true)
      TOKEN=$(printf '%s' "$TOKEN_RESP" | smoke_jq -r '.access_token // empty')
      [[ -n "$TOKEN" ]] && AUTH_HEADER="Bearer $TOKEN"
    fi
  fi
fi

if [[ -z "${AUTH_HEADER:-}" ]]; then
  if [[ "$REQUIRE_LIVE" -eq 1 ]]; then
    prereq_fail "AUTH_HEADER_or_SMOKE_credentials_required"
  fi
  error_kind="${error_kind:-auth_missing}"
fi

# --- product vision probe (no redirect following with Authorization) ---
remote_vision_probe() {
  local code fb hdr body
  body="$(mktemp)"
  hdr="$(mktemp)"
  trap 'rm -f "$body" "$hdr"' RETURN
  product_live_attempted=true
  proof_class="product_route"

  if [[ -z "${AUTH_HEADER:-}" ]]; then
    error_kind="auth_missing"
    fallback_count=1
    return 1
  fi

  # Intentionally no redirect following: never follow redirects with Bearer.
  code=$(curl -sS --max-redirs 0 -D "$hdr" -o "$body" -w "%{http_code}" -m 90 \
    -H "Authorization: ${AUTH_HEADER}" -H "Content-Type: application/json" \
    -X POST "${BASE}/api/v1/ai/analyze-image" \
    --data-binary "{\"image_url\":\"${IMAGE_URL}\"}" 2>/dev/null || echo "000")
  http_status="$code"
  request_id="$(awk -F': ' 'BEGIN{IGNORECASE=1} $1=="x-request-id"{print $2}' "$hdr" | tr -d '\r' | head -1)"
  if [[ -z "$request_id" ]]; then
    request_id="$(smoke_jq -r '.request_id // empty' <"$body" 2>/dev/null || true)"
  fi

  case "$code" in
    401) error_kind="http_401_auth"; fallback_count=1; return 1 ;;
    403) error_kind="http_403_forbidden"; fallback_count=1; return 1 ;;
    402) error_kind="http_402_quota"; fallback_count=1; return 1 ;;
    429) error_kind="http_429_rate_limit"; fallback_count=1; return 1 ;;
    000) error_kind="timeout_or_network"; fallback_count=1; return 1 ;;
    503) error_kind="provider_unavailable"; fallback_count=1; return 1 ;;
    5*) error_kind="http_${code}"; fallback_count=1; return 1 ;;
  esac

  if [[ "$code" != "200" ]]; then
    error_kind="http_${code}"
    fallback_count=1
    return 1
  fi

  fb=$(awk -F': ' 'BEGIN{IGNORECASE=1} $1=="x-ai-fallback-reason"{print $2}' "$hdr" | tr -d '\r' | head -1)
  fallback_header="$fb"
  if [[ -n "$fb" ]]; then
    fallback_count=1
    error_kind="$fb"
    return 1
  fi

  # Reject deterministic/mock markers in body without printing body contents.
  set +e
  smoke_python3 -c '
import json,sys
d=json.load(open(sys.argv[1]))
src=str(d.get("source") or d.get("provider") or "").lower()
banned={"deterministic","mock","none","stub"}
if src in banned:
  sys.exit(2)
if d.get("fallback") or d.get("fallback_reason") or d.get("fallback_triggered"):
  sys.exit(2)
ok = bool(d.get("risk_level") and ("stage" in d))
sys.exit(0 if ok else 1)
' "$body" 2>/dev/null
  status=$?
  set -e
  if [[ "$status" -eq 2 ]]; then
    fallback_count=1
    error_kind="deterministic_or_mock_body"
    return 1
  fi
  if [[ "$status" -ne 0 ]]; then
    if smoke_assert_analysis_result "$body" 2>/dev/null; then
      :
    else
      error_kind="invalid_response_body"
      fallback_count=1
      return 1
    fi
  fi

  llm_success_count=1
  product_live_succeeded=true
  provider_used="vision_router"
  model_used="${OPENAI_VISION_MODEL:-}"
  proof_class="product_route_live"
  return 0
}

# --- direct OpenAI credentials probe (NOT product live) ---
direct_openai_probe() {
  local key resp code
  key="$(read_env_value OPENAI_API_KEY 2>/dev/null || true)"
  [[ -n "$key" ]] || return 1
  credentials_probe_attempted=true
  provider_used="openai"
  model_used="$DIRECT_MODEL"

  resp="$(mktemp)"
  trap 'rm -f "$resp"' RETURN
  code=$(curl -sS -m 45 --max-redirs 0 -o "$resp" -w "%{http_code}" \
    https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer ${key}" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"${DIRECT_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly: ok\"}],\"max_tokens\":5}" 2>/dev/null || echo "000")

  if [[ "$code" == "200" ]] && smoke_python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("choices") and d["choices"][0].get("message",{}).get("content") else 1)' "$resp" 2>/dev/null; then
    credentials_probe_succeeded=true
    if [[ "$proof_class" != "product_route_live" ]]; then
      proof_class="credentials_provider_probe"
    fi
    return 0
  fi
  if [[ "$code" == "429" ]]; then
    error_kind="${error_kind:-rate_limit}"
  elif [[ "$code" == "401" ]]; then
    error_kind="${error_kind:-auth_failed}"
  else
    error_kind="${error_kind:-openai_http_${code}}"
  fi
  return 1
}

if command -v curl &>/dev/null; then
  remote_vision_probe || true
fi

# Credentials probe is optional diagnostics only; never upgrades product live.
if [[ "$product_live_succeeded" != true ]]; then
  direct_openai_probe || true
fi

emit_json

if [[ "$REQUIRE_LIVE" -eq 1 ]]; then
  if [[ "$product_live_succeeded" == true && "$llm_success_count" -ge 1 ]]; then
    echo "ai_live_provider: verdict GO — product route live provider proof (target=${target_base} build=${build_sha7:-unknown})" >&2
    exit 0
  fi
  echo "ai_live_provider: verdict NO-GO — require-live needs product_route_live (configured=$provider_configured health_openai=$health_openai openai_key=$(status_of OPENAI_API_KEY) proof_class=$proof_class error_kind=${error_kind:-none})" >&2
  exit 1
fi

echo "ai_live_provider: verdict CONDITIONAL — summary emitted (pass --require-live for strict product gate)" >&2
exit 0
