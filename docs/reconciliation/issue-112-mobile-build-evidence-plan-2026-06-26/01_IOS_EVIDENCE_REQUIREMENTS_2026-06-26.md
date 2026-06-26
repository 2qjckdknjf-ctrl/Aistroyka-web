# iOS Evidence Requirements (2026-06-26)

Apps: `ios/AiStroykaManager/AiStroykaManager.xcodeproj` (scheme `AiStroykaManager`) and `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` (scheme `AiStroykaWorker`); shared local SwiftPM package `ios/Shared`.

## Required local/CI environment (to be recorded, not assumed)
- **Host:** macOS (CI uses `macos-latest`; local uses a Mac). Record OS version.
- **Xcode:** record exact version via `xcodebuild -version` (CI logs this in `ios-ui-smoke.yml` / `ios-e2e-integration.yml`).
- **Simulator target:** iPhone simulator UDID, chosen via `ios/scripts/ci-pick-iphone-simulator-udid.sh`. Record device name + iOS runtime.
- **Device target (only if device/archive/TestFlight):** record device model + iOS version + UDID.
- **Signing:**
  - Simulator smoke uses **ad-hoc signing** (`CODE_SIGNING_ALLOWED=NO` / `CODE_SIGN_IDENTITY=-`) — no org secrets, no provisioning profile.
  - Device build / archive / TestFlight requires a **Development Team**, provisioning profile, and signing identity — must be explicitly provided; **not** assumed and **not** in this plan.

## Evidence required BEFORE any iOS readiness claim
1. **Clean checkout SHA** the build ran against (must match the claimed `main` SHA).
2. **Build command used**, verbatim. Reference commands on `main`:
   - Simulator build (no signing): `bash scripts/ios/build-simulator.sh` (runs `xcodebuild -scheme <AiStroykaWorker|AiStroykaManager> -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO`).
   - UITest smoke: `bash ios/scripts/run-ios-uitest-smoke-local.sh` (or CI `.github/workflows/ios-ui-smoke.yml`, `xcodebuild test -scheme … -destination 'id=<UDID>'`).
3. **Build log / artifact path** (saved log file, `.xcresult` bundle path, or CI run URL + job id).
4. **Simulator/device smoke result:** both `WorkerSmokeUITests` and `ManagerSmokeUITests` PASS (login surface + `pilot_*` identifiers), with run URL or local log.
5. **Workflow result (if CI):** `ios-ui-smoke.yml` conclusion `success` with run URL; record `xcodebuild -version` from the log.
6. **Screenshots/logs** if available (UITest attachments / `.xcresult`).

## Evidence required BEFORE any TestFlight / App Store claim
1. **Archive success:** `xcodebuild archive` for the Release configuration with a valid Development Team + provisioning (record team id reference, not secrets).
2. **Signing/export success:** `xcodebuild -exportArchive` with a valid export options plist; record export method (app-store) and that it succeeded.
3. **Upload success:** upload to App Store Connect (e.g. `xcrun altool`/`notarytool` or Transporter) returns success; record upload id/timestamp.
4. **App Store Connect / TestFlight processing evidence:** build appears in App Store Connect, processing completes, and (for TestFlight) is available to a test group — record build number + processing state.

## Explicit guardrails
- **No iOS readiness claim** without items 1–6 of the readiness section as concrete artifacts.
- **No TestFlight/App Store claim** without all four store-evidence items.
- Ad-hoc simulator success is **build/smoke evidence only** — it is **not** a store/pilot-live claim.
- Layer B live E2E (`ios-e2e-integration.yml`) requires live tenant secrets (`PILOT_E2E_*`, production Supabase) and is **manual `workflow_dispatch`**; its result is pilot-flow evidence, not a store claim.
