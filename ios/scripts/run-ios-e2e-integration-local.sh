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

# xcodebuild often does not forward shell env to the UITest runner; write a gitignored bridge file.
UITEST_CRED_FILE="$IOS_ROOT/Config/.uitest-e2e-credentials"
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
  if [[ -n "${IOS_E2E_PROJECT_ID:-}" ]]; then
    echo "IOS_E2E_PROJECT_ID=$IOS_E2E_PROJECT_ID"
  fi
} >"$UITEST_CRED_FILE"
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
DEST="id=$UDID"
echo "Using destination $DEST"
echo "E2E email: ${IOS_E2E_EMAIL}"

SIGN=()
if [[ "${CI_SIGNING_HACK:-}" == "1" ]]; then
  SIGN=(CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO)
fi

run_e2e_test() {
  local project="$1"
  local scheme="$2"
  local test_target="$3"
  local -a xb_args=(
    test
    -project "$project"
    -scheme "$scheme"
    -destination "$DEST"
    -parallel-testing-enabled NO
    -maximum-parallel-testing-workers 1
    -only-testing:"$test_target"
  )
  if ((${#SIGN[@]} > 0)); then
    xcodebuild "${xb_args[@]}" "${SIGN[@]}"
  else
    xcodebuild "${xb_args[@]}"
  fi
}

run_worker_e2e() {
  if ! run_e2e_test \
    "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
    "AiStroykaWorker" \
    "AiStroykaWorkerUITests/WorkerSmokeUITests/testWorker_livePilot_loginAndOpenNewReportDraft"; then
    echo "Worker E2E failed; retrying once after simulator reboot..."
    xcrun simctl shutdown "$UDID" || true
    xcrun simctl boot "$UDID" || true
    sleep 5
    run_e2e_test \
      "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
      "AiStroykaWorker" \
      "AiStroykaWorkerUITests/WorkerSmokeUITests/testWorker_livePilot_loginAndOpenNewReportDraft"
  fi
}

run_worker_e2e

run_manager_e2e() {
  local test_name="$1"
  if ! run_e2e_test \
    "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
    "AiStroykaManager" \
    "AiStroykaManagerUITests/ManagerSmokeUITests/$test_name"; then
    echo "Manager E2E $test_name failed; retrying once after simulator reboot..."
    xcrun simctl shutdown "$UDID" || true
    xcrun simctl boot "$UDID" || true
    sleep 5
    run_e2e_test \
      "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
      "AiStroykaManager" \
      "AiStroykaManagerUITests/ManagerSmokeUITests/$test_name"
  fi
}

run_manager_e2e "testManager_livePilot_projectIntelligenceAndCopilot"
run_manager_e2e "testManager_livePilot_loginAndReachReportsInbox"

echo "OK — Worker + Manager live pilot E2E UITests passed (reports + intelligence/copilot)."
