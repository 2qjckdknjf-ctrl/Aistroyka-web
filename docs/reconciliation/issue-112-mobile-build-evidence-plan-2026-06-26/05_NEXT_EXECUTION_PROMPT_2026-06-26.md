# Next Execution Prompt Outline (2026-06-26)

For a **future** operator that will actually run native builds, once the toolchain is available. This is an outline only — it runs **no** commands here. Do **not** include secrets; do **not** assume credentials.

## Preconditions (verify before running)
- iOS: macOS host with Xcode installed; `xcodebuild -version` recorded; an iPhone simulator available. Device/archive/TestFlight additionally needs a Development Team + provisioning (explicitly provided, not assumed).
- Android: Android SDK (api 34), JDK 17, Gradle 8.2 via `android/gradlew`; an emulator (api 34) or device. Release/Play additionally needs a signing keystore via gitignored `android/keystore.properties` (never committed).
- Clean checkout at a recorded `main` SHA.

## iOS — build/smoke evidence (no signing required)
1. `xcodebuild -version` → record.
2. `bash scripts/ios/build-simulator.sh` → expect both simulator builds succeed; save log.
3. `bash ios/scripts/run-ios-uitest-smoke-local.sh` (or dispatch `ios-ui-smoke.yml`) → expect `WorkerSmokeUITests` + `ManagerSmokeUITests` PASS; save `.xcresult`/run URL.
4. Record SHA, commands, logs into a new `docs/reconciliation/issue-112-mobile-build-evidence-<date>/` evidence report.

## iOS — store evidence (only if/when signing provided)
1. `xcodebuild archive` (Release) → `-exportArchive` (app-store) → upload to App Store Connect.
2. Record archive/export/upload success + TestFlight processing state. No secret values in docs.

## Android — build/smoke evidence
1. `cd android && ./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` → save log + APK paths.
2. `cd android && ./gradlew :shared:test` → expect unit tests PASS.
3. `cd android && ./gradlew :AiStroykaWorker:connectedDebugAndroidTest` (emulator api 34, or dispatch `android-instrumented-smoke.yml`) → expect `WorkerAppLaunchInstrumentedTest` PASS; save run URL.
4. Record into the evidence report.

## Android — store evidence (only if/when keystore provided)
1. `./gradlew :AiStroykaWorker:bundleRelease` (and Manager) with real signing config → `bash scripts/android/verify-worker-release-no-photo-bypass.sh` PASS.
2. Upload AAB to Play Console internal track; record versionCode + processing state. No secret values in docs.

## Web/pilot dependency (if applicable)
- `GET /api/v1/health` on target env → record `buildStamp.sha7`; compare to deployed target. No deploy from this outline.

## Output
- A dated evidence report under `docs/reconciliation/` with SHAs, commands, logs/run URLs, and per-gate PASS/FAIL — then update `docs/release-hardening/MOBILE_PILOT_READINESS.md` and the truth index in separate small PRs.

## Guardrails (carry forward)
- Each build/smoke step is its own small, validated slice; no broad mobile branch merge.
- No store/pilot-live claim without the corresponding store-evidence artifacts.
- No secrets committed; keystore and E2E credentials stay gitignored.
