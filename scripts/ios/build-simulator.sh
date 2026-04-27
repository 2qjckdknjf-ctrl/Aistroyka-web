#!/usr/bin/env bash
# Reproducible iOS Simulator builds without Apple Development signing (CI / local truth).
# Device builds require provisioning profiles / development team — not covered here.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/ios"

SCHEME_WORKER="${1:-AiStroykaWorker}"
SCHEME_MANAGER="${2:-AiStroykaManager}"

build_one() {
  local scheme="$1"
  local dir="$2"
  echo "=== xcodebuild scheme=$scheme (iphonesimulator, signing disabled) ==="
  (cd "$dir" && xcodebuild \
    -scheme "$scheme" \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'generic/platform=iOS Simulator' \
    build \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO)
}

build_one "$SCHEME_WORKER" "AiStroykaWorker"
build_one "$SCHEME_MANAGER" "AiStroykaManager"
echo "=== OK: both simulator builds succeeded ==="
