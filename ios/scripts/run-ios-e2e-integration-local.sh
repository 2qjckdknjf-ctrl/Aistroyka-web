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

export IOS_E2E_EMAIL="${IOS_E2E_EMAIL:-${SMOKE_EMAIL:-${E2E_EMAIL:-}}}"
export IOS_E2E_PASSWORD="${IOS_E2E_PASSWORD:-${SMOKE_PASSWORD:-${E2E_PASSWORD:-}}}"
export IOS_E2E_WORKER_EMAIL="${IOS_E2E_WORKER_EMAIL:-$IOS_E2E_EMAIL}"
export IOS_E2E_WORKER_PASSWORD="${IOS_E2E_WORKER_PASSWORD:-$IOS_E2E_PASSWORD}"
export IOS_E2E_MANAGER_EMAIL="${IOS_E2E_MANAGER_EMAIL:-$IOS_E2E_EMAIL}"
export IOS_E2E_MANAGER_PASSWORD="${IOS_E2E_MANAGER_PASSWORD:-$IOS_E2E_PASSWORD}"
# xcodebuild inherits these for the UITest runner process.
export SMOKE_EMAIL="$IOS_E2E_EMAIL"
export SMOKE_PASSWORD="$IOS_E2E_PASSWORD"

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
  xcodebuild test \
    -project "$project" \
    -scheme "$scheme" \
    -destination "$DEST" \
    -parallel-testing-enabled NO \
    -maximum-parallel-testing-workers 1 \
    -only-testing:"$test_target" \
    "${SIGN[@]}"
}

run_e2e_test \
  "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
  "AiStroykaWorker" \
  "AiStroykaWorkerUITests/WorkerSmokeUITests/testWorker_livePilot_loginAndOpenNewReportDraft"

if ! run_e2e_test \
  "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
  "AiStroykaManager" \
  "AiStroykaManagerUITests/ManagerSmokeUITests/testManager_livePilot_loginAndReachReportsInbox"; then
  echo "Manager E2E failed; retrying once after simulator reboot..."
  xcrun simctl shutdown "$UDID" || true
  xcrun simctl boot "$UDID" || true
  sleep 5
  run_e2e_test \
    "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
    "AiStroykaManager" \
    "AiStroykaManagerUITests/ManagerSmokeUITests/testManager_livePilot_loginAndReachReportsInbox"
fi

echo "OK — Worker + Manager live pilot E2E UITests passed."
