# Owner Action Plan

Ordered next steps to move the mobile pilot distribution decision from NO-GO toward
a future GO. Each platform track is a dedicated code/config + store effort
(out of scope for this docs-only checklist).

## iOS (issue #158)

1. Provide / verify Distribution certificate and App Store provisioning profiles.
2. Decide Push Notifications and Sign in with Apple capability scope.
3. Add / verify app-store `ExportOptions.plist`.
4. Configure ASC API key or choose interactive Xcode upload path.
5. Complete store metadata / privacy declarations.
6. Bump build number.
7. Produce signed archive + TestFlight upload evidence.

## Android (issue #159)

1. Wire `release` `signingConfig` from the existing local keystore (no secrets committed).
2. Bump `compileSdk` / `targetSdk` to 35.
3. Add a `versionCode` bump strategy.
4. Verify Play Console app records / access.
5. Complete listing / Data safety / privacy.
6. Build signed AAB.
7. Upload to internal testing track and capture evidence.

## Pilot (issue #160)

1. Confirm pilot tenant / project / users (≈5 workers, ≈3 managers).
2. Confirm backend target (staging vs production).
3. Confirm support / rollback / feedback loop.
4. Re-run the final GO / NO-GO checklist after iOS and Android signed-upload
   evidence exists.

## Sequencing note

The two store tracks (#158, #159) can proceed in parallel. The final mobile pilot
GO decision depends on **both** producing signed-upload evidence **and** the pilot
+ legal/privacy gates being satisfied.
