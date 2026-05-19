#!/usr/bin/env bash
# Prints one available iPhone Simulator UDID to stdout (for xcodebuild -destination "id=...").
# UITests cannot use generic/platform=iOS Simulator. Prefer newer runtimes when listed first.
#
# Only rows whose *simulator name* starts with "iPhone" (after simctl indent). Skips renamed devices
# like "HiAir Fresh iPhone 15" — they still work, but the xcodebuild log then looks like a different app
# is under test; the bundle is always the scheme target (AiStroykaManager / AiStroyka Worker).
set -euo pipefail

UDID=""
for needle in "iPhone 16" "iPhone 15" "iPhone 14" "iPhone SE"; do
  line="$(xcrun simctl list devices available | grep "$needle" | grep "(" | grep -E "^[[:space:]]+iPhone" | head -1 || true)"
  if [[ -n "$line" ]]; then
    UDID="$(echo "$line" | sed -nE 's/.*\(([A-F0-9-]+)\).*/\1/p')"
    break
  fi
done
if [[ -z "$UDID" ]]; then
  line="$(xcrun simctl list devices available | grep -E "^[[:space:]]+iPhone" | grep -m1 "(" || true)"
  UDID="$(echo "$line" | sed -nE 's/.*\(([A-F0-9-]+)\).*/\1/p')"
fi
if [[ -z "$UDID" ]]; then
  echo "ci-pick-iphone-simulator-udid: no available iPhone simulator" >&2
  exit 1
fi
echo "$UDID"
