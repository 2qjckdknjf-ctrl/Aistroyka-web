#!/usr/bin/env bash
# Run the same Worker + Manager UITest smoke targets as CI (login surface), using a picked Simulator.
# Requires macOS + Xcode; use your normal signing setup (Development Team in the project).
# Optional: CI_SIGNING_HACK=1 to pass ad-hoc simulator flags (matches GitHub Actions).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UDID="$("$SCRIPT_DIR/ci-pick-iphone-simulator-udid.sh")"
DEST="id=$UDID"
echo "Using destination $DEST"

SIGN=()
if [[ "${CI_SIGNING_HACK:-}" == "1" ]]; then
  SIGN=(CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO)
fi

run_smoke_test() {
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

run_smoke_test \
  "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
  "AiStroykaWorker" \
  "AiStroykaWorkerUITests/WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers"

if ! run_smoke_test \
  "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
  "AiStroykaManager" \
  "AiStroykaManagerUITests/ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers"; then
  echo "Manager smoke failed; retrying once after simulator reboot..."
  xcrun simctl shutdown "$UDID" || true
  xcrun simctl boot "$UDID" || true
  sleep 5
  run_smoke_test \
    "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
    "AiStroykaManager" \
    "AiStroykaManagerUITests/ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers"
fi

echo "OK — Worker and Manager UITest smoke passed."
