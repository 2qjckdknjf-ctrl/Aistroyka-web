# Claims & Remaining Blockers

## Blockers cleared by this PR (code/local)

| Prior blocker (PR #162) | Status after this PR |
| --- | --- |
| Release signing not wired in Gradle | **CLEARED** — `release` signingConfig wired; signed APK/AAB produced & verified |
| Local keystore untracked/unreferenced | **CLEARED** — referenced via gitignored `keystore.properties` (never committed) |
| `targetSdk 34` below Play API 35 | **CLEARED** — `compileSdk`/`targetSdk` = 35 (AGP 8.6.1 / Gradle 8.7) |
| `versionCode` hard-coded to 1 | **CLEARED** — override via `AISTROYKA_ANDROID_VERSION_CODE` (default 1) |

## Blockers still OWNER_ACTION_REQUIRED (store-side, out of code scope)

| Blocker | Owner action |
| --- | --- |
| Play Console access / app records not verifiable | Provision/verify Play Console app records for both app IDs |
| Store metadata / Data safety / privacy policy | Complete listing, Data safety (Worker: CAMERA + FCM), privacy policy |
| No publishing pipeline | (Optional) add Gradle Play Publisher / fastlane, or upload manually |
| Signed AAB internal-track upload evidence missing | Upload signed AAB to internal testing; capture upload evidence |
| Play App Signing enrollment | Confirm local upload key matches Play App Signing (or enroll) |

## Claims

| Claim | Value |
| --- | --- |
| Signed release AAB build readiness (local) | **READY** (proven) |
| Google Play readiness | **OWNER_ACTION_REQUIRED** (store-side blockers remain) |
| store/distribution readiness | **NOT claimed** |
| pilot-live | **NO** |
| production GA | **NO** |
| upload performed | **NO** |
| secrets committed | **NO** |
| keystore/AAB/APK artifacts committed | **NO** |
