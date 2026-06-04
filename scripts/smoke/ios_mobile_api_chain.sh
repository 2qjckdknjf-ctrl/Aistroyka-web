#!/usr/bin/env bash
# iOS Layer B — mobile API transaction chain (Worker + Manager headers) against live pilot.
# Proves the same routes iOS apps call: projects → report create → sync → manager me/reports.
#
# Usage (from repo root):
#   set -a && source .env.pilot && source apps/web/.env.local && set +a
#   BASE_URL=https://aistroyka.ai ./scripts/smoke/ios_mobile_api_chain.sh
#
# Requires: SMOKE_EMAIL, SMOKE_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
set -euo pipefail

BASE="${BASE_URL:-https://aistroyka.ai}"
BASE="${BASE%/}"
SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
EMAIL="${SMOKE_EMAIL:-${E2E_EMAIL:-${IOS_E2E_EMAIL:-}}}"
PASS="${SMOKE_PASSWORD:-${E2E_PASSWORD:-${IOS_E2E_PASSWORD:-}}}"

if [[ -z "$EMAIL" || -z "$PASS" || -z "$SUPA_URL" || -z "$SUPA_KEY" ]]; then
  echo "ios_mobile_api_chain: need SMOKE_EMAIL, SMOKE_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY" >&2
  exit 2
fi

if ! command -v jq &>/dev/null; then
  echo "ios_mobile_api_chain: jq required" >&2
  exit 2
fi

mint_token() {
  curl -sSL -m 20 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
    -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
    --data-binary "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}"
}

TOKEN_JSON=$(mint_token)
TOKEN=$(printf '%s' "$TOKEN_JSON" | jq -r '.access_token // empty')
if [[ -z "$TOKEN" ]]; then
  echo "ios_mobile_api_chain: auth failed" >&2
  printf '%s' "$TOKEN_JSON" | head -c 300 >&2 || true
  exit 1
fi

AUTH="Bearer $TOKEN"
WORKER_CLIENT="ios_worker"
MANAGER_CLIENT="ios_manager"
IDEM="ios-chain-$(date +%s)-$$"

api() {
  local method="$1" path="$2" client="$3"
  shift 3
  local body="${1:-}"
  local extra=()
  [[ -n "$body" ]] && extra+=(-H "Content-Type: application/json" --data-binary "$body")
  curl -sSL -m 30 -X "$method" "${BASE}${path}" \
    -H "Authorization: $AUTH" \
    -H "x-client: $client" \
    -H "x-idempotency-key: ${IDEM}-$(echo -n "$path" | shasum -a 256 | cut -c1-8)" \
    "${extra[@]}"
}

echo "ios_mobile_api_chain: base=$BASE"

# Worker contour
code_config=$(curl -sSL -o /tmp/ios_cfg.json -w "%{http_code}" -m 15 \
  -H "Authorization: $AUTH" -H "x-client: $WORKER_CLIENT" "$BASE/api/v1/config" || true)
[[ "$code_config" == "200" ]] || { echo "FAIL config HTTP $code_config" >&2; exit 1; }
echo "  worker GET /api/v1/config OK"

code_projects=$(curl -sSL -o /tmp/ios_projects.json -w "%{http_code}" -m 20 \
  -H "Authorization: $AUTH" -H "x-client: $WORKER_CLIENT" "$BASE/api/v1/projects" || true)
[[ "$code_projects" == "200" ]] || { echo "FAIL projects HTTP $code_projects" >&2; exit 1; }
PROJECT_ID=$(jq -r '.data[0].id // empty' /tmp/ios_projects.json)
if [[ -z "$PROJECT_ID" ]]; then
  echo "FAIL worker projects list empty (tenant membership / pilot data)" >&2
  exit 1
fi
echo "  worker GET /api/v1/projects OK (project_id present)"

api POST "/api/v1/worker/day/start" "$WORKER_CLIENT" "{}" >/tmp/ios_day.json || true
echo "  worker POST /api/v1/worker/day/start attempted"

# createReport uses day_id/task_id only; tenant context supplies project scope
CREATE_RESP=$(api POST "/api/v1/worker/report/create" "$WORKER_CLIENT" "{}")
REPORT_ID=$(printf '%s' "$CREATE_RESP" | jq -r '.data.id // empty')
if [[ -z "$REPORT_ID" ]]; then
  echo "FAIL worker/report/create: $(printf '%s' "$CREATE_RESP" | head -c 400)" >&2
  exit 1
fi
echo "  worker POST /api/v1/worker/report/create OK (report_id=${REPORT_ID:0:8}…)"

SYNC_CODE=$(curl -sSL -o /tmp/ios_sync.json -w "%{http_code}" -m 20 \
  -H "Authorization: $AUTH" -H "x-client: $WORKER_CLIENT" "$BASE/api/v1/worker/sync" || true)
[[ "$SYNC_CODE" == "200" ]] || { echo "FAIL worker/sync HTTP $SYNC_CODE" >&2; exit 1; }
echo "  worker GET /api/v1/worker/sync OK"

# Manager contour (same user when role allows)
ME_CODE=$(curl -sSL -o /tmp/ios_me.json -w "%{http_code}" -m 20 \
  -H "Authorization: $AUTH" -H "x-client: $MANAGER_CLIENT" "$BASE/api/v1/me" || true)
[[ "$ME_CODE" == "200" ]] || { echo "FAIL manager /api/v1/me HTTP $ME_CODE" >&2; exit 1; }
ROLE=$(jq -r '.data.role // empty' /tmp/ios_me.json)
echo "  manager GET /api/v1/me OK (role=${ROLE:-unknown})"

REPORTS_CODE=$(curl -sSL -o /tmp/ios_reports.json -w "%{http_code}" -m 20 \
  -H "Authorization: $AUTH" -H "x-client: $MANAGER_CLIENT" "$BASE/api/v1/reports?limit=5" || true)
[[ "$REPORTS_CODE" == "200" ]] || { echo "FAIL manager /api/v1/reports HTTP $REPORTS_CODE" >&2; exit 1; }
REPORT_COUNT=$(jq -r '.data | length' /tmp/ios_reports.json)
echo "  manager GET /api/v1/reports OK (count=$REPORT_COUNT)"

PROJECT_ID="${IOS_CHAIN_PROJECT_ID:-${PILOT_SMOKE_PROJECT_ID_PRODUCTION:-}}"
if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID=$(curl -sSL -m 20 -H "Authorization: $AUTH" -H "x-client: $MANAGER_CLIENT" \
    "$BASE/api/v1/projects?limit=1" | jq -r '.data[0].id // empty' 2>/dev/null || true)
fi
if [[ -n "$PROJECT_ID" ]]; then
  INTEL_CODE=$(curl -sSL -o /tmp/ios_intel.json -w "%{http_code}" -m 45 \
    -H "Authorization: $AUTH" -H "x-client: $MANAGER_CLIENT" \
    "$BASE/api/v1/projects/$PROJECT_ID/intelligence" || true)
  [[ "$INTEL_CODE" == "200" ]] || { echo "FAIL manager intelligence HTTP $INTEL_CODE" >&2; exit 1; }
  echo "  manager GET /api/v1/projects/…/intelligence OK"
else
  echo "  skip manager intelligence (no project id)"
fi

echo "ios_mobile_api_chain: PASS (worker create+sync, manager me+reports+intelligence)"
