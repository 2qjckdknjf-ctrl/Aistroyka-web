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

xcodebuild test \
  -project "$IOS_ROOT/AiStroykaWorker/AiStroykaWorker.xcodeproj" \
  -scheme AiStroykaWorker \
  -destination "$DEST" \
  -only-testing:AiStroykaWorkerUITests/WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers \
  "${SIGN[@]}"

xcodebuild test \
  -project "$IOS_ROOT/AiStroykaManager/AiStroykaManager.xcodeproj" \
  -scheme AiStroykaManager \
  -destination "$DEST" \
  -only-testing:AiStroykaManagerUITests/ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers \
  "${SIGN[@]}"

echo "OK — Worker and Manager UITest smoke passed."
