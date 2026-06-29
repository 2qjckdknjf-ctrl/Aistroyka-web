# Android Distribution Gate

Source: PR #162 / issue #159 (`docs/reconciliation/issue-159-android-distribution-preflight-2026-06-29/`).

## Build evidence

| Item | Result |
| --- | --- |
| Manager `assembleRelease` | **PASS (unsigned APK)** |
| Worker `assembleRelease` | **PASS (unsigned APK)** |
| Manager `bundleRelease` | **PASS (unsigned AAB)** |
| Worker `bundleRelease` | **PASS (unsigned AAB)** |
| Application IDs | `ai.aistroyka.manager`, `ai.aistroyka.worker` |
| versionCode / versionName | `1` / `1.0.0` |
| min / target / compile SDK | `26` / `34` / `34` |

## Readiness verdicts

| Target | Verdict |
| --- | --- |
| Android distribution readiness | **OWNER_ACTION_REQUIRED** |
| Google Play readiness | **OWNER_ACTION_REQUIRED** |

## Blockers

1. Release signing not wired in Gradle (no `signingConfigs`) → artifacts unsigned.
2. Local keystore exists (`android/.secrets/upload-keystore.jks`, `keystore.properties`)
   but is untracked and not referenced in Gradle.
3. `targetSdk 34` below Google Play's current target API requirement (API 35 / Android 15).
4. `versionCode` hard-coded to `1` (no auto-increment; bump required per upload).
5. Play Console access / app records not verifiable locally.
6. Store metadata / Data safety / privacy not verifiable locally.
7. No automated publishing pipeline (manual Play Console upload only).
8. Signed AAB / internal-track upload evidence missing.

## Owner actions

- Wire `release` `signingConfig` from the existing local keystore (no secrets committed).
- Bump `compileSdk` / `targetSdk` to 35; re-validate.
- Add a `versionCode` bump strategy.
- Verify Play Console app records / access.
- Complete listing + Data safety + privacy policy.
- Build signed AAB; upload to internal testing and capture evidence.

## State

- Issue #159: **OPEN**
- **Android distribution gate verdict: OWNER_ACTION_REQUIRED (BLOCKED for upload).**
