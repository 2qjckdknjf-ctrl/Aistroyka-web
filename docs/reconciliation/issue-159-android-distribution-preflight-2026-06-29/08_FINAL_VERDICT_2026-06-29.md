# Final Verdict — Android Distribution Preflight

- **Android distribution preflight safe:** YES (inspection + docs only; no upload,
  no signing/keystore mutation, no secrets committed, no deploy, no live data)
- **Google Play readiness verdict:** **OWNER_ACTION_REQUIRED**
- **Android distribution readiness verdict:** **OWNER_ACTION_REQUIRED**

## Ready aspects

- Both apps build release variants successfully:
  - Manager `assembleRelease` PASS, `bundleRelease` PASS
  - Worker `assembleRelease` PASS, `bundleRelease` PASS
- Application IDs are valid and distinct (`ai.aistroyka.manager`, `ai.aistroyka.worker`).
- Upload-key material exists locally (`android/.secrets/upload-keystore.jks`,
  `android/keystore.properties`).
- Firebase FCM config present for Worker (`google-services.json`, on `main`).

## Blockers

1. **Signing not wired** — no `signingConfigs` in Gradle → release artifacts are
   unsigned (`*-release-unsigned.apk`, unsigned AAB). Not uploadable as-is.
2. **`targetSdk 34`** below Google Play's current target API requirement
   (API 35 / Android 15, enforced since 2025-08-31) — likely upload rejection.
3. **`versionCode` hard-coded to `1`** — must bump per upload (no auto-increment).
4. **Play Console access / app records** not verifiable locally (no service account / login).
5. **Store metadata / Data safety / privacy policy** not verifiable locally
   (Play Console-side; Worker needs CAMERA + FCM declarations).
6. **No automated publishing pipeline** (no Gradle Play Publisher / fastlane).

## Functional observations (not upload blockers, owner code PR)

- Worker missing `POST_NOTIFICATIONS` permission despite FCM (Android 13+).
- No `FileProvider` declared in Worker despite CAMERA.
- `allowBackup="true"` on both — review sensitive-data backup exclusions.
- Keystore files untracked but not matched by a `.gitignore` rule — add explicit ignores.

## Owner actions (separate code PRs, not this docs-only PR)

1. Add `release` `signingConfig` reading `keystore.properties`; verify Play App Signing.
2. Bump `targetSdk`/`compileSdk` to 35 and re-validate.
3. Introduce a `versionCode` bump strategy.
4. Provision Play Console app records; capture verified access evidence.
5. Complete store listing, Data safety form, and privacy policy.
6. (Optional) add `POST_NOTIFICATIONS` + `FileProvider`; tighten `allowBackup`.
7. (Hygiene) add `.gitignore` rules for keystore material.

## Issue #159

- **Can close:** **NO** — issue #159 remains OPEN until the blockers above are
  cleared and a **signed AAB Play upload (internal testing track)** evidence exists.

## Next exact step

Owner wires Android release signing (action 1) and bumps `targetSdk` to 35
(action 2) in a dedicated code PR, then re-runs `bundleRelease` to produce a
**signed** AAB for an internal-testing-track upload.
