# Android Evidence Requirements (2026-06-26)

Apps: `android/AiStroykaManager`, `android/AiStroykaWorker`; shared `android/shared`. Build root `android/` (Gradle Kotlin DSL).

## Required local/CI environment (to be recorded, not assumed)
- **Android SDK / build targets (from `main` config):** `compileSdk = 34`, `targetSdk = 34`, `minSdk = 26`; AGP **8.2.x**.
- **JDK:** **17** (`sourceCompatibility`/`targetCompatibility = 17`, `kotlinOptions.jvmTarget = "17"`; CI `android-instrumented-smoke.yml` uses `java-version: "17"`).
- **Gradle:** **8.2** (`android/gradle/wrapper/gradle-wrapper.properties` → `gradle-8.2-bin.zip`); invoke via `android/gradlew`.
- **Emulator/device target:** CI uses `reactivecircus/android-emulator-runner@v2` at **api-level 34**. Record AVD api level/ABI or physical device model + Android version.
- **Host:** CI uses `ubuntu-latest`. Record OS for local runs.

## Evidence required BEFORE any Android readiness claim
1. **Clean checkout SHA** the build ran against (must match claimed `main` SHA).
2. **Gradle build command(s)**, verbatim. Reference commands:
   - Assemble debug: `cd android && ./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug`.
   - Shared unit tests: `cd android && ./gradlew :shared:test` (covers `SubmitReportBodyTest`).
   - Instrumented launch smoke (CI on `main`): `cd android && ./gradlew :AiStroykaWorker:connectedDebugAndroidTest` (`WorkerAppLaunchInstrumentedTest`).
3. **Build log / artifact path** (Gradle output log; APK path e.g. `android/AiStroykaWorker/build/outputs/apk/debug/*.apk`; or CI run URL + job id).
4. **Instrumented launch/smoke result:** `connectedDebugAndroidTest` PASS on an emulator/device, with run URL or local log.
5. **Workflow result (if CI):** `android-instrumented-smoke.yml` conclusion `success` with run URL; record JDK 17 + api-level 34.

## Evidence required BEFORE any Google Play claim
1. **Release build/signing evidence:** `./gradlew :AiStroykaWorker:bundleRelease` (and/or `:AiStroykaManager:bundleRelease`) succeeds with a real signing config (keystore referenced via gitignored `android/keystore.properties` — **never** commit the keystore/secrets). Record signing config presence, not secret values.
2. **No-photo-bypass guard (Worker release):** `bash scripts/android/verify-worker-release-no-photo-bypass.sh` PASS for the release build.
3. **Upload / internal testing track evidence:** AAB uploaded to Play Console (internal/closed testing); record upload timestamp + track.
4. **Play Console processing evidence:** release processed/available on the chosen track; record versionCode + status.

## Explicit guardrails
- **No Android readiness claim** without items 1–5 of the readiness section as concrete artifacts.
- **No Google Play claim** without all four store-evidence items.
- A successful debug assemble/instrumented launch is **build/smoke evidence only** — it is **not** a store/pilot-live claim.
- Treat Android as the secondary contour (iOS-primary); do not expand Android scope speculatively.
