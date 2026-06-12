#!/usr/bin/env bash
# Layer B — live pilot UITests (Worker + Manager) against production/staging API.
# Requires macOS + Xcode, ios/Config/Secrets.xcconfig with real SUPABASE_ANON_KEY + BASE_URL.
# Credentials: export IOS_E2E_* or SMOKE_EMAIL/SMOKE_PASSWORD (loaded from repo-root .env.pilot when present).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$IOS_ROOT/.." && pwd)"

if [[ -f "$REPO_ROOT/.env.pilot" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env.pilot"
  set +a
fi
if [[ -f "$REPO_ROOT/apps/web/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/apps/web/.env.local"
  set +a
fi

export IOS_E2E_BASE_URL="${IOS_E2E_BASE_URL:-${PILOT_E2E_BASE_URL:-${PILOT_SMOKE_BASE_URL:-https://aistroyka.ai}}}"
export IOS_E2E_EMAIL="${IOS_E2E_EMAIL:-${SMOKE_EMAIL:-${E2E_EMAIL:-}}}"
export IOS_E2E_PASSWORD="${IOS_E2E_PASSWORD:-${SMOKE_PASSWORD:-${E2E_PASSWORD:-}}}"
export IOS_E2E_WORKER_EMAIL="${IOS_E2E_WORKER_EMAIL:-$IOS_E2E_EMAIL}"
export IOS_E2E_WORKER_PASSWORD="${IOS_E2E_WORKER_PASSWORD:-$IOS_E2E_PASSWORD}"
export IOS_E2E_MANAGER_EMAIL="${IOS_E2E_MANAGER_EMAIL:-$IOS_E2E_EMAIL}"
export IOS_E2E_MANAGER_PASSWORD="${IOS_E2E_MANAGER_PASSWORD:-$IOS_E2E_PASSWORD}"
export SMOKE_EMAIL="$IOS_E2E_EMAIL"
export SMOKE_PASSWORD="$IOS_E2E_PASSWORD"

# Pin first tenant project for Manager navigation when the simulator list is slow to hydrate.
if [[ -z "${IOS_E2E_PROJECT_ID:-}" ]]; then
  BASE_URL="${IOS_E2E_BASE_URL:-${PILOT_E2E_BASE_URL:-${PILOT_SMOKE_BASE_URL:-https://aistroyka.ai}}}"
  BASE_URL="${BASE_URL%/}"
  SUPA_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  SUPA_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
  if [[ -n "$SUPA_URL" && -n "$SUPA_KEY" && -n "$IOS_E2E_EMAIL" && -n "$IOS_E2E_PASSWORD" ]] && command -v jq &>/dev/null; then
    TOKEN_JSON=$(curl -sSL -m 20 -X POST "${SUPA_URL}/auth/v1/token?grant_type=password" \
      -H "Content-Type: application/json" -H "apikey: $SUPA_KEY" \
      --data-binary "{\"email\":\"${IOS_E2E_EMAIL}\",\"password\":\"${IOS_E2E_PASSWORD}\"}" || true)
    TOKEN=$(printf '%s' "$TOKEN_JSON" | jq -r '.access_token // empty')
    if [[ -n "$TOKEN" ]]; then
      IOS_E2E_PROJECT_ID=$(curl -sSL -m 20 \
        -H "Authorization: Bearer $TOKEN" -H "x-client: ios_worker" \
        "${BASE_URL}/api/v1/projects?limit=1" | jq -r '.data[0].id // empty' 2>/dev/null || true)
      export IOS_E2E_PROJECT_ID
    fi
  fi
fi
if [[ -n "${IOS_E2E_PROJECT_ID:-}" ]]; then
  echo "E2E project_id: ${IOS_E2E_PROJECT_ID}"
fi

UITEST_CRED_FILE="$IOS_ROOT/Config/.uitest-e2e-credentials"

write_e2e_credentials() {
  umask 077
  {
    echo "SMOKE_EMAIL=$IOS_E2E_EMAIL"
    echo "SMOKE_PASSWORD=$IOS_E2E_PASSWORD"
    echo "IOS_E2E_EMAIL=$IOS_E2E_EMAIL"
    echo "IOS_E2E_PASSWORD=$IOS_E2E_PASSWORD"
    echo "IOS_E2E_WORKER_EMAIL=$IOS_E2E_WORKER_EMAIL"
    echo "IOS_E2E_WORKER_PASSWORD=$IOS_E2E_WORKER_PASSWORD"
    echo "IOS_E2E_MANAGER_EMAIL=$IOS_E2E_MANAGER_EMAIL"
    echo "IOS_E2E_MANAGER_PASSWORD=$IOS_E2E_MANAGER_PASSWORD"
    echo "AISTROYKA_E2E_EMAIL=$IOS_E2E_EMAIL"
    echo "AISTROYKA_E2E_PASSWORD=$IOS_E2E_PASSWORD"
    echo "IOS_E2E_BASE_URL=$IOS_E2E_BASE_URL"
    echo "AISTROYKA_E2E_BASE_URL=$IOS_E2E_BASE_URL"
    echo "BASE_URL=$IOS_E2E_BASE_URL"
    if [[ -n "${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}" ]]; then
      echo "SUPABASE_URL=${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
    fi
    if [[ -n "${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}" ]]; then
      echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
    fi
    if [[ -n "${IOS_E2E_PROJECT_ID:-}" ]]; then
      echo "IOS_E2E_PROJECT_ID=$IOS_E2E_PROJECT_ID"
      echo "AISTROYKA_E2E_PROJECT_ID=$IOS_E2E_PROJECT_ID"
    fi
    if [[ -n "${IOS_E2E_ACCESS_TOKEN:-}" ]]; then
      echo "IOS_E2E_ACCESS_TOKEN=$IOS_E2E_ACCESS_TOKEN"
      echo "AISTROYKA_E2E_ACCESS_TOKEN=$IOS_E2E_ACCESS_TOKEN"
    fi
    if [[ -n "${IOS_E2E_USER_ID:-}" ]]; then
      echo "IOS_E2E_USER_ID=$IOS_E2E_USER_ID"
      echo "AISTROYKA_E2E_USER_ID=$IOS_E2E_USER_ID"
    fi
  } >"$UITEST_CRED_FILE"
}

cleanup_uitest_cred_file() { rm -f "$UITEST_CRED_FILE"; }
trap cleanup_uitest_cred_file EXIT INT TERM

if [[ -z "${IOS_E2E_EMAIL:-}" || -z "${IOS_E2E_PASSWORD:-}" ]]; then
  echo "BLOCKED: set SMOKE_EMAIL/SMOKE_PASSWORD in .env.pilot or export IOS_E2E_EMAIL/IOS_E2E_PASSWORD" >&2
  exit 2
fi

if [[ ! -f "$IOS_ROOT/Config/Secrets.xcconfig" ]]; then
  echo "Copy ios/Config/Secrets.xcconfig.example -> Secrets.xcconfig and set SUPABASE_ANON_KEY + BASE_URL" >&2
  exit 2
fi

UDID="$("$SCRIPT_DIR/ci-pick-iphone-simulator-udid.sh")"
# Pin simulator explicitly — avoid xcodebuild waiting on a busy physical iPhone.
DEST="platform=iOS Simulator,id=$UDID"
echo "Using destination $DEST (simulator $UDID)"
echo "E2E email: ${IOS_E2E_EMAIL}"

# Fail fast if pilot cannot reach manager /me (avoids long UITest hangs on unauthorized).
PREFLIGHT_SUPA="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
PREFLIGHT_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
if [[ -n "$PREFLIGHT_SUPA" && -n "$PREFLIGHT_KEY" ]] && command -v jq &>/dev/null; then
  PREFLIGHT_BASE="${IOS_E2E_BASE_URL}"
  PREFLIGHT_BASE="${PREFLIGHT_BASE%/}"
  PF_TOKEN=$(curl -sSL -m 20 -X POST "${PREFLIGHT_SUPA}/auth/v1/token?grant_type=password" \
    -H "Content-Type: application/json" -H "apikey: $PREFLIGHT_KEY" \
    --data-binary "{\"email\":\"${IOS_E2E_EMAIL}\",\"password\":\"${IOS_E2E_PASSWORD}\"}" | jq -r '.access_token // empty' 2>/dev/null || true)
  if [[ -n "$PF_TOKEN" ]]; then
    IOS_E2E_ACCESS_TOKEN="$PF_TOKEN"
    export IOS_E2E_ACCESS_TOKEN
    IOS_E2E_USER_ID=$(printf '%s' "$PF_TOKEN" | python3 -c "import sys,base64,json; p=sys.stdin.read().strip().split('.')[1]; p+='='*(-len(p)%4); print(json.loads(base64.urlsafe_b64decode(p)).get('sub',''))" 2>/dev/null || true)
    export IOS_E2E_USER_ID
    PF_CODE=$(curl -sSL -o /dev/null -w "%{http_code}" -m 20 \
      -H "Authorization: Bearer $PF_TOKEN" -H "x-client: ios_manager" \
      "${PREFLIGHT_BASE}/api/v1/me" || echo "000")
    [[ "$PF_CODE" == "200" ]] || {
      echo "BLOCKED: manager GET /api/v1/me returned HTTP $PF_CODE on $PREFLIGHT_BASE" >&2
      exit 2
    }
    echo "Preflight manager /api/v1/me OK on $PREFLIGHT_BASE"
    WF_CODE=$(curl -sSL -o /dev/null -w "%{http_code}" -m 20 \
      -H "Authorization: Bearer $PF_TOKEN" -H "x-client: ios_worker" \
      "${PREFLIGHT_BASE}/api/v1/me" || echo "000")
    [[ "$WF_CODE" == "200" ]] || {
      echo "BLOCKED: worker GET /api/v1/me returned HTTP $WF_CODE on $PREFLIGHT_BASE" >&2
      exit 2
    }
    echo "Preflight worker /api/v1/me OK on $PREFLIGHT_BASE"
  fi
fi

# After preflight token fetch: bridge creds into UITest runner + Shared bundle resource.
write_e2e_credentials

# Propagate pilot env into xcodebuild / XCTest runner (PilotE2ECredentials + app launchEnvironment).
export AISTROYKA_E2E_CRED_FILE="$UITEST_CRED_FILE"
export SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
export AISTROYKA_E2E_BASE_URL="$IOS_E2E_BASE_URL"
export AISTROYKA_E2E_EMAIL="$IOS_E2E_EMAIL"
export AISTROYKA_E2E_PASSWORD="$IOS_E2E_PASSWORD"

xcrun simctl shutdown "$UDID" 2>/dev/null || true
xcrun simctl boot "$UDID" 2>/dev/null || true
for _ in $(seq 1 30); do
  state="$(xcrun simctl list devices | grep "$UDID" | sed -nE 's/.*\(([^)]+)\).*/\1/p' | head -1 || true)"
  if [[ "$state" == "Booted" ]]; then
    break
  fi
  sleep 1
done
open -a Simulator --args -CurrentDeviceUDID "$UDID" 2>/dev/null || true
sleep 3

SIGN=()
if [[ "${CI_SIGNING_HACK:-}" == "1" ]]; then
  SIGN=(CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO)
fi

E2E_LOG_DIR="${TMPDIR:-/tmp}/aistroyka-ios-e2e-$$"
mkdir -p "$E2E_LOG_DIR"

build_for_e2e() {
  local project="$1"
  local scheme="$2"
  local log="$E2E_LOG_DIR/build-${scheme}.log"
  echo "Building $scheme for testing (log: $log)..."
  local -a xb_args=(
    build-for-testing
    -project "$project"
    -scheme "$scheme"
    -destination "$DEST"
    -destination-timeout 120
    -quiet
  )
  if ((${#SIGN[@]} > 0)); then
    xcodebuild "${xb_args[@]}" "${SIGN[@]}" >"$log" 2>&1
  else
    xcodebuild "${xb_args[@]}" >"$log" 2>&1
  fi
}

run_e2e_test() {
  local project="$1"
  local scheme="$2"
  local test_target="$3"
  local log="$E2E_LOG_DIR/${test_target//\//_}.log"
  # UITest runner reads ios/Config/.uitest-e2e-credentials — refresh before each xcodebuild invoke.
  write_e2e_credentials
  export AISTROYKA_E2E_CRED_FILE="$UITEST_CRED_FILE"
  echo "Running $test_target (log: $log)..."
  local -a xb_args=(
    test-without-building
    -project "$project"
    -scheme "$scheme"
    -destination "$DEST"
    -destination-timeout 120
    -parallel-testing-enabled NO
    -maximum-parallel-testing-workers 1
    -only-testing:"$test_target"
  )
  if ((${#SIGN[@]} > 0)); then
    xcodebuild "${xb_args[@]}" "${SIGN[@]}" 2>&1 | tee "$log"
  else
    xcodebuild "${xb_args[@]}" 2>&1 | tee "$log"
  fi
  local status=${PIPESTATUS[0]}
  if [[ $status -ne 0 ]]; then
    echo "--- tail $log ---"
    tail -30 "$log"
  fi
  return $status
}

run_worker_e2e() {
  if ! run_e2e_test \
    "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
    "AiStroykaWorker" \
    "AiStroykaWorkerUITests/WorkerSmokeUITests/testWorker_livePilot_loginAndOpenNewReportDraft"; then
    echo "Worker E2E failed; retrying once after simulator reboot..."
    write_e2e_credentials
    xcrun simctl shutdown "$UDID" || true
    xcrun simctl boot "$UDID" || true
    sleep 5
    run_e2e_test \
      "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
      "AiStroykaWorker" \
      "AiStroykaWorkerUITests/WorkerSmokeUITests/testWorker_livePilot_loginAndOpenNewReportDraft"
  fi
}

run_manager_e2e() {
  local test_name="$1"
  if ! run_e2e_test \
    "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
    "AiStroykaManager" \
    "AiStroykaManagerUITests/ManagerSmokeUITests/$test_name"; then
    echo "Manager E2E $test_name failed; retrying once after simulator reboot..."
    write_e2e_credentials
    xcrun simctl shutdown "$UDID" || true
    xcrun simctl boot "$UDID" || true
    sleep 5
    run_e2e_test \
      "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
      "AiStroykaManager" \
      "AiStroykaManagerUITests/ManagerSmokeUITests/$test_name"
  fi
}

build_for_e2e "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" "AiStroykaManager"
if [[ -n "${IOS_E2E_ONLY_TEST:-}" ]]; then
  run_manager_e2e "${IOS_E2E_ONLY_TEST##*/}"
else
  run_manager_e2e "testManager_livePilot_projectIntelligenceAndCopilot"
  run_manager_e2e "testManager_livePilot_loginAndReachReportsInbox"
fi

if [[ "${IOS_E2E_SKIP_WORKER:-}" != "1" ]]; then
  build_for_e2e "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" "AiStroykaWorker"
  run_worker_e2e
else
  echo "Skipping Worker E2E (IOS_E2E_SKIP_WORKER=1)"
fi

echo "OK — Manager + Worker live pilot E2E UITests passed (intelligence/copilot + report draft)."
