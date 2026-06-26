# Mobile Pilot Go / No-Go Checklist (2026-06-26)

Base: `main` @ `17150a05bf73a93380962ca6c56207e4781d98cf`. "Status now" reflects evidence present in repo/docs **today**; nothing is marked PASS without an artifact. No native builds were run for this plan.

| Gate | Required evidence | Status now | Blocking? |
|------|-------------------|------------|-----------|
| iOS clean build | `scripts/ios/build-simulator.sh` (or CI) success + log/SHA | NOT VERIFIED (no build run; needs Xcode/simulator) | YES |
| iOS simulator/device smoke | `WorkerSmokeUITests` + `ManagerSmokeUITests` PASS (`ios-ui-smoke.yml` or local) + run URL/log | NOT VERIFIED | YES |
| iOS TestFlight/App Store (if applicable) | archive + signing/export + upload + ASC/TestFlight processing | NOT VERIFIED (signing/credentials not provided) | YES (for store/pilot-live only) |
| Android Gradle build | `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` success + log/SHA | NOT VERIFIED (no build run; needs Android SDK/Gradle/JDK17) | YES |
| Android emulator/device smoke | `:AiStroykaWorker:connectedDebugAndroidTest` PASS (`android-instrumented-smoke.yml` or local) + run URL/log | NOT VERIFIED | YES |
| Android Google Play (if applicable) | release bundle + signing + upload + Play Console processing | NOT VERIFIED (keystore/credentials not provided) | YES (for store/pilot-live only) |
| Web deployed buildStamp (if pilot depends on web) | `GET /api/v1/health` `buildStamp.sha7` matches deployed target | NOT VERIFIED (no deploy/health check in this PR) | YES (if web-dependent) |
| Backend/API environment sanity | `/api/v1` reachable; lite allow-list paths (`ios_lite`/`android_lite`) behave; 409 `serverCursor` reconciliation per `docs/runbooks/MOBILE_SYNC.md` | NOT VERIFIED (not exercised here) | YES |
| Auth/session sanity | Manager + Worker login, token refresh, re-auth against target env | NOT VERIFIED | YES |
| Report upload/review E2E sanity | Worker create + before/after photos + submit/sync; Manager inbox review (approve/reject/changes_requested) | NOT VERIFIED | YES |
| Push notifications (if pilot depends) | Android FCM (`WorkerFirebaseMessagingService`) + iOS push registration delivery proof | NOT VERIFIED | Conditional (only if pilot uses push) |

## Summary
- **All build/runtime gates are NOT VERIFIED** at this SHA; this is a planning artifact, not a pass/fail run.
- **No mobile readiness / pilot-live / store claim is safe** until the blocking gates above carry concrete artifacts.
