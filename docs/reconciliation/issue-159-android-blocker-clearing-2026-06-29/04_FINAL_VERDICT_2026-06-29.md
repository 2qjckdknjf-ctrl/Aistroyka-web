# Final Verdict — Android Blocker-Clearing

- **PR safe:** YES (Android Gradle config + `.gitignore` only; no upload, no secrets,
  no deploy, no live data, no iOS/web/workflow/package changes)
- **Local signed release AAB build readiness:** **READY** (proven for Manager + Worker)
- **Google Play readiness:** **OWNER_ACTION_REQUIRED** (store-side blockers remain)

## Code blockers cleared

1. compileSdk/targetSdk → 35 (AGP 8.6.1 / Gradle 8.7).
2. Release signingConfig wired from gitignored `keystore.properties` (signed APK/AAB verified).
3. versionCode override (`AISTROYKA_ANDROID_VERSION_CODE`, default 1).
4. `.gitignore` hardened for signing materials + build artifacts.

## Remaining (owner, store-side)

- Play Console app records / access.
- Store listing + Data safety + privacy policy.
- Play App Signing enrollment / upload-key registration.
- Signed AAB internal-testing-track upload + evidence.

## Issue #159

- **Can close:** **NO** — remains OPEN until store-side blockers are cleared and a
  signed-AAB internal-track upload evidence exists.

## Next exact step

1. Open this PR and merge through the protected path (web validation green; native
   release builds proven locally).
2. Owner: register/confirm upload key with Play App Signing, provision Play Console
   app records, complete listing/Data safety/privacy, then build a store AAB with
   `-PAISTROYKA_ANDROID_VERSION_CODE=<n>` and upload to the internal testing track.
