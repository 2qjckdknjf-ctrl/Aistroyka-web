#!/usr/bin/env bash
# Wave 0.5 — Prove AiStroykaWorker **release** BuildConfig sets PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = false.
# Does not print secrets. Requires JDK + Android SDK (same as ./gradlew).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/android"
./gradlew :AiStroykaWorker:assembleRelease
BC_RELEASE="$ROOT/android/AiStroykaWorker/build/generated/source/buildConfig/release/ai/aistroyka/worker/BuildConfig.java"
if ! grep -q 'PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = false' "$BC_RELEASE"; then
  echo "FAIL: expected PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = false in release BuildConfig"
  exit 1
fi
echo "OK: release Worker build has photo gate enabled (no submit-without-photo bypass)."
