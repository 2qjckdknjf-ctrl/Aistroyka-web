# Current Android State — 2026-06-29

## Status snapshot

| Item | State |
| --- | --- |
| Android local signed AAB readiness | **READY** |
| Google Play readiness | **OWNER_ACTION_REQUIRED** |
| Repo-side blockers (SDK/signing/version) | CLEARED by PR #164 |
| Local signed AAB evidence | CAPTURED by PR #165 |
| Upload performed | **NO** |
| Play Console mutated | **NO** |

## Detail

- `compileSdk`/`targetSdk` = 35 (Play target-API requirement met); AGP 8.6.1, Gradle 8.7, JDK 17.
- Release signing is wired from gitignored `android/keystore.properties` + `android/.secrets/upload-keystore.jks` (never committed).
- `versionCode` is overridable via the `AISTROYKA_ANDROID_VERSION_CODE` Gradle property / env var; `versionName` = `1.0.0`.
- App IDs: `ai.aistroyka.manager`, `ai.aistroyka.worker`.
- Local signed AABs build successfully and verify (AAB `jar verified`; APK apksigner `v2=true`; cert `CN=AiStroyka`).

## What remains (all owner / Play-side)

1. Play Console app records for both packages.
2. Play App Signing enrollment + upload-key registration.
3. Internal testing track setup + testers.
4. Store listing, Data safety, privacy policy, content rating, graphics.
5. Service account credential (or approved interactive upload path) + confirmed `versionCode`.
6. Signed-AAB internal-track upload evidence.

These are enumerated as actionable checklists in the following files.
