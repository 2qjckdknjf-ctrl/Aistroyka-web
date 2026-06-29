# Local Signed AAB Evidence — 2026-06-29

## versionCode used

- `AISTROYKA_ANDROID_VERSION_CODE=2026062901` (local evidence value; no owner-provided value was set)
- versionName: `1.0.0` (unchanged)
- Override mechanism: Gradle property / env var `AISTROYKA_ANDROID_VERSION_CODE` (wired in PR #164)

> Note: `2026062901` is a local-evidence integer only. A store upload must use an
> owner-confirmed `versionCode` (and it must be higher than any value already on a
> Play track). This value is **not** an upload commitment.

## Keystore inputs (presence only — no values printed)

- `android/keystore.properties`: PRESENT (keys: `storeFile`, `storePassword`, `keyAlias`, `keyPassword` — values REDACTED)
- `android/.secrets/upload-keystore.jks`: PRESENT
- Both are gitignored and were **not** committed.

## Build results (`./gradlew :<App>:bundleRelease -PAISTROYKA_ANDROID_VERSION_CODE=2026062901`)

| App | applicationId | bundleRelease | AAB (local only, not committed) |
| --- | --- | --- | --- |
| Manager | `ai.aistroyka.manager` | BUILD SUCCESSFUL | `android/AiStroykaManager/build/outputs/bundle/release/AiStroykaManager-release.aab` (8.7M) |
| Worker | `ai.aistroyka.worker` | BUILD SUCCESSFUL | `android/AiStroykaWorker/build/outputs/bundle/release/AiStroykaWorker-release.aab` (6.8M) |

## Signature verification (no secret/private data printed)

- AAB `jarsigner -verify`: **jar verified** (Manager + Worker).
- Release APK `apksigner verify --print-certs` (same signing config):
  - Verified using **v2 scheme: true** (v1/v3/v4: false)
  - Signer #1 certificate DN: `CN=AiStroyka, OU=Mobile, O=AiStroyka, L=EU, ST=EU, C=DE`

## Outcome

- Signed AAB produced: **YES** (both apps)
- Local signed-AAB build readiness: **READY**
- Upload-key registration in Play App Signing: **OWNER_ACTION_REQUIRED** (cannot be verified locally)
- No secrets printed; no AAB/log artifacts committed.
