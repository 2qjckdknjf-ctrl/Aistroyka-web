#!/usr/bin/env bash
# Phase 7.7.1 — Pilot launch one-command verification.
# Calls cron-tick (with x-cron-secret when CRON_SECRET set), ops/metrics (with from/to), prints key counters.
# Exits non-zero if any endpoint fails.
#
# ops/metrics auth (tenant-scoped): server accepts Supabase *user* JWT (access_token) or browser session Cookie.
# Do NOT use: service_role JWT (rejected), Supabase CLI PAT / non-JWT tokens (401).
# AUTH_HEADER must include the Bearer prefix, e.g. AUTH_HEADER="Bearer eyJ..."
# Full operator guide: docs/launch/STAGE4_BLOCKER_RESOLUTION_AUTH_AND_PILOT_PREP.md
#
# Preflight (no network): from repo root — `bun run smoke:pilot:check` (optional `--strict` for metrics auth).
#
# Usage:
#   BASE_URL=http://localhost:3000 ./scripts/smoke/pilot_launch.sh
#   CRON_SECRET=xxx BASE_URL=... ./scripts/smoke/pilot_launch.sh          # cron-tick when REQUIRE_CRON_SECRET=true
#   COOKIE="sb-...=..." BASE_URL=... ./scripts/smoke/pilot_launch.sh      # ops/metrics tenant-scoped (session cookie)
#   AUTH_HEADER="Bearer <token>" BASE_URL=... ./scripts/smoke/pilot_launch.sh  # Supabase user access_token JWT
#   SMOKE_EMAIL=... SMOKE_PASSWORD=... with SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_*) => optional token for metrics (no secrets printed)
# Metrics uses Authorization or Cookie; apex→www redirect must keep credentials: --location-trusted (curl drops Authorization on cross-host redirect with -L alone).
# Same rule applies to any authenticated curl to BASE_URL (e.g. worker/tasks, tasks/:id, reports/:id): use curl --location-trusted or a fixed canonical host.
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
CRON="${CRON_SECRET:-}"
AUTH="${AUTH_HEADER:-}"
COOKIE="${COOKIE:-}"
FAIL=0
STRICT_HEALTH="${STRICT_HEALTH_200:-auto}"

is_local_base() {
  [[ "$BASE" == http://localhost* || "$BASE" == https://localhost* || "$BASE" == http://127.0.0.1* || "$BASE" == https://127.0.0.1* ]]
}

json_field() {
  local file="$1"
  local field="$2"
  if command -v jq &>/dev/null; then
    jq -r ".${field} // empty" "$file" 2>/dev/null | tr -d '\n'
  else
    sed -nE "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"([^\"]+)\".*/\\1/p" "$file" 2>/dev/null | head -n1 | tr -d '\n'
  fi
}

# Optional: obtain Bearer token for ops/metrics when COOKIE/AUTH_HEADER not set (env-only; do not log credentials)
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

# Tenant routes (e.g. ops/metrics) need a user JWT that passes getUser(). When password grant is
# configured, prefer it over a static pilot bearer (may be stale or not a full user session).
if [[ -z "$COOKIE" && -n "${SMOKE_EMAIL:-}" && -n "${SMOKE_PASSWORD:-}" ]]; then
  MUSER="$(mint_smoke_token_if_possible || true)"
  if [[ -n "$MUSER" ]]; then
    AUTH="$MUSER"
  fi
fi

# Default from/to: last 7 days to today (portable date)
TO=$(date -u +%Y-%m-%d)
if date -u -v-7d +%Y-%m-%d &>/dev/null; then
  FROM=$(date -u -v-7d +%Y-%m-%d)
else
  FROM=$(date -u -d '7 days ago' +%Y-%m-%d)
fi

echo "Pilot launch smoke: $BASE (from=$FROM to=$TO)"

ALLOW_HEALTH_503=1
case "$STRICT_HEALTH" in
  1|true|TRUE|yes|YES) ALLOW_HEALTH_503=0 ;;
  0|false|FALSE|no|NO) ALLOW_HEALTH_503=1 ;;
  auto|AUTO|"")
    if [[ "$BASE" == *"aistroyka.ai"* && "$BASE" != *"staging.aistroyka.ai"* ]]; then
      ALLOW_HEALTH_503=0
    fi
    ;;
  *)
    echo "  WARN: unknown STRICT_HEALTH_200='$STRICT_HEALTH', using auto mode"
    if [[ "$BASE" == *"aistroyka.ai"* && "$BASE" != *"staging.aistroyka.ai"* ]]; then
      ALLOW_HEALTH_503=0
    fi
    ;;
esac

# 0) Health (no auth) — must pass
code=$(curl -sSL -o /tmp/pilot_health.json -w "%{http_code}" -m 15 "$BASE/api/v1/health" || true)
if [[ "$code" != "200" && ! ( "$ALLOW_HEALTH_503" -eq 1 && "$code" == "503" ) ]]; then
  echo "  FAIL: GET /api/v1/health → HTTP $code"
  FAIL=1
else
  if grep -q '"ok"' /tmp/pilot_health.json 2>/dev/null; then
    echo "  PASS: health"
  else
    echo "  FAIL: health response missing ok"
    FAIL=1
  fi
fi

# 0b) Config (worker-critical, no auth) — must return 200
code=$(curl -sSL -o /tmp/pilot_config.json -w "%{http_code}" -m 10 "$BASE/api/v1/config" || true)
if [[ "$code" != "200" ]]; then
  echo "  FAIL: GET /api/v1/config → HTTP $code"
  FAIL=1
else
  echo "  PASS: config"
fi

# 1) POST /api/v1/admin/jobs/cron-tick (x-cron-secret when CRON_SECRET set or when required by server)
if [[ -n "$CRON" ]]; then
  code=$(curl -sSL -o /tmp/pilot_cron.json -w "%{http_code}" -m 30 -X POST \
    -H "Content-Type: application/json" -H "x-cron-secret: $CRON" \
    "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [[ "$code" == "200" ]]; then
    if command -v jq &>/dev/null && [[ "$(jq -r '.ok // "true"' /tmp/pilot_cron.json)" != "true" ]]; then
      echo "  FAIL: cron-tick returned ok:false"
      FAIL=1
    else
      echo "  PASS: cron-tick"
    fi
  else
    echo "  FAIL: cron-tick → HTTP $code"
    FAIL=1
  fi
else
  code=$(curl -sSL -o /tmp/pilot_cron.json -w "%{http_code}" -m 30 -X POST \
    -H "Content-Type: application/json" \
    "$BASE/api/v1/admin/jobs/cron-tick" || true)
  if [[ "$code" == "200" ]]; then
    if command -v jq &>/dev/null && [[ "$(jq -r '.ok // "true"' /tmp/pilot_cron.json)" != "true" ]]; then
      echo "  FAIL: cron-tick returned ok:false"
      FAIL=1
    else
      echo "  PASS: cron-tick (no secret)"
    fi
  elif [[ "$code" == "403" ]]; then
    echo "  FAIL: cron-tick 403 (set CRON_SECRET when REQUIRE_CRON_SECRET=true)"
    FAIL=1
  elif [[ "$code" == "503" ]]; then
    ERR_CODE="$(json_field /tmp/pilot_cron.json error_code)"
    ERR_MSG="$(json_field /tmp/pilot_cron.json error)"
    if is_local_base; then
      echo "  WARN: cron-tick skipped locally (HTTP 503${ERR_CODE:+, code=$ERR_CODE}${ERR_MSG:+, error=$ERR_MSG})"
    else
      echo "  FAIL: cron-tick → HTTP $code"
      FAIL=1
    fi
  else
    echo "  FAIL: cron-tick → HTTP $code"
    FAIL=1
  fi
fi

# 2) GET /api/v1/ops/metrics?from=&to= (tenant-scoped; requires Cookie or Authorization)
fetch_metrics() {
  local auth_header="$1"
  local cookie_header="$2"
  local extra=()
  [[ -n "$auth_header" ]] && extra+=(-H "Authorization: $auth_header")
  [[ -n "$cookie_header" ]] && extra+=(-H "Cookie: $cookie_header")
  curl -sSL --location-trusted -o /tmp/pilot_metrics.json -w "%{http_code}" -m 15 \
    ${extra+"${extra[@]}"} \
    "$BASE/api/v1/ops/metrics?from=$FROM&to=$TO" || true
}

code="$(fetch_metrics "$AUTH" "$COOKIE")"
if [[ "$code" == "401" && -n "$AUTH" && -z "$COOKIE" ]]; then
  MINTED="$(mint_smoke_token_if_possible || true)"
  if [[ -n "$MINTED" && "$MINTED" != "$AUTH" ]]; then
    AUTH="$MINTED"
    code="$(fetch_metrics "$AUTH" "$COOKIE")"
  fi
fi
if [[ "$code" != "200" ]]; then
  ERR_HINT=""
  if command -v jq &>/dev/null; then
    ERR_HINT=$(jq -r '.error // empty' /tmp/pilot_metrics.json 2>/dev/null | tr -d '\n' || true)
  fi
  if [[ "$code" == "401" && -z "$AUTH" && -z "$COOKIE" ]]; then
    echo "  FAIL: ops/metrics → HTTP $code (set COOKIE or AUTH_HEADER, or SMOKE_EMAIL+SMOKE_PASSWORD+Supabase keys)"
  elif [[ "$code" == "403" && -n "$ERR_HINT" ]]; then
    echo "  FAIL: ops/metrics → HTTP $code ($ERR_HINT)"
  elif [[ "$code" == "401" ]]; then
    EXTRA=""
    if [[ -z "${SMOKE_EMAIL:-}" || -z "${SMOKE_PASSWORD:-}" ]]; then
      EXTRA=" Add optional PILOT_SMOKE_EMAIL_* + PILOT_SMOKE_PASSWORD_* and Supabase URL/anon secrets so CI can mint a user JWT, or rotate PILOT_SMOKE_BEARER_* to a valid user access_token (see docs/release/PHASE3_PILOT_SMOKE_USAGE.md)."
    fi
    echo "  FAIL: ops/metrics → HTTP $code (tenant auth rejected${ERR_HINT:+ — $ERR_HINT}).$EXTRA"
  else
    echo "  FAIL: ops/metrics → HTTP $code (set COOKIE or AUTH_HEADER for tenant auth${ERR_HINT:+ — $ERR_HINT})"
  fi
  FAIL=1
else
  echo "  PASS: ops/metrics"
  # Print key counters (jq optional)
  if command -v jq &>/dev/null; then
    echo "  Counters: uploads_stuck=$(jq -r '.uploads_stuck // "?"' /tmp/pilot_metrics.json) uploads_expired=$(jq -r '.uploads_expired // "?"' /tmp/pilot_metrics.json) devices_offline=$(jq -r '.devices_offline // "?"' /tmp/pilot_metrics.json) sync_conflicts=$(jq -r '.sync_conflicts // "?"' /tmp/pilot_metrics.json) tasks_assigned_today=$(jq -r '.tasks_assigned_today // "?"' /tmp/pilot_metrics.json) tasks_open_today=$(jq -r '.tasks_open_today // "?"' /tmp/pilot_metrics.json) tasks_completed_today=$(jq -r '.tasks_completed_today // "?"' /tmp/pilot_metrics.json)"
  else
    echo "  (install jq to print counters; raw: /tmp/pilot_metrics.json)"
  fi
fi

if [[ $FAIL -eq 1 ]]; then
  exit 1
fi
echo "  pilot_launch done"
exit 0
