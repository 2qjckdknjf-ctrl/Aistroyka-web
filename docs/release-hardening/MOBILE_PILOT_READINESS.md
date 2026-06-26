# Mobile pilot readiness

> Refreshed 2026-06-26 to match current `main` (`61707470dcea9e565afdd96d8238248c2efbd46a`) after PR #140.
> Source of truth for the underlying audit: `docs/reconciliation/issue-112-mobile-fresh-audit-2026-06-26/**` (issue #112).
> This document records **source presence and validation reality only**. It makes **no** TestFlight / App Store / Google Play / pilot-live / production-GA claim, and does **not** assume latest `main` is deployed (confirm any deploy claim via `GET /api/v1/health` `buildStamp.sha7`).
> Evidence required before any pilot/store claim: `docs/reconciliation/issue-112-mobile-build-evidence-plan-2026-06-26/`.

## iOS Manager (AiStroykaManager)

- **Status:** Present and source-complete on `main` (`ios/AiStroykaManager/AiStroykaManager.xcodeproj`). Views cover login, dashboard, projects, project detail, reports inbox, tasks, team, AI tab, copilot chat, settings, onboarding, unauthorized; Services include `ManagerAPI`, `ManagerCopilotService`, `ManagerIntelligenceModels`.
- **API:** Full `/api/v1` access — `x-client` is not in the lite allow-list, so Manager is not path-restricted.
- **AI:** Per-project Intelligence + Copilot SSE; see `docs/ai/IOS_MANAGER_AI_PARITY_MATRIX.md`.
- **Pilot:** Validate auth (token refresh, re-auth) and critical flows on device/simulator against production before any pilot claim.
- **Crash reporting:** Add Sentry or similar (abstraction + config doc); CONFIG-REQUIRED.

## iOS Worker (AiStroykaWorker)

- **Status:** Present and source-complete on `main` (`ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`). The **WorkerLite → AiStroykaWorker rename is complete** on `main` (no WorkerLite app target remains). Views cover login, home, project picker, report create/resubmit, camera/image picker, task detail, diagnostics, onboarding; Services include `WorkerAPI`, `SyncService`, `UploadManager`, `BackgroundUploadService`, `PushRegistrationService`, `OperationQueueExecutor`, `LocalReminderService`.
- **API:** Lite profile (`ios_lite`) restricted by the Edge allow-list (`apps/web/lib/api/lite-allow-list.ts`): config, `worker/*`, `sync/*`, `media/upload-sessions*`, `devices*`, `reports/[id]/analysis-status`.
- **Offline:** Offline queue vs sync per `docs/runbooks/MOBILE_OFFLINE_QUEUE.md`; 409 reconciliation via `serverCursor` per `docs/runbooks/MOBILE_SYNC.md`.

## iOS Shared

- **Status:** Present (`ios/Shared/Sources/Shared/*`): `APIClient`, `AuthService`, `Endpoints`, `KeychainHelper`, `Config`, `DeviceContext`, `NetworkMonitor`, `CopilotSSEClient`, `E2EAutoSignIn`, `MobileClientProfile`, etc. Consumed by both apps as a local Swift package.

## Android

- **Status:** Android apps **are present on `main`** (this corrects the prior "no app in repo" claim). `android/AiStroykaManager`, `android/AiStroykaWorker`, and `android/shared` exist with Gradle build files.
  - **Android Manager:** present as a Compose scaffold (`MainActivity`, `ManagerViewModel`, `ManagerApplication`, `ui/*` theme/app). UI surface is **thinner than iOS Manager** — expected parity gap under the iOS-primary stance, not a regression.
  - **Android Worker:** present as a Compose scaffold + `WorkerFirebaseMessagingService` (FCM) + an instrumented launch test (`WorkerAppLaunchInstrumentedTest`). Release no-photo-bypass guard: `scripts/android/verify-worker-release-no-photo-bypass.sh`.
  - **Android Shared:** `android/shared/src/main/java/ai/aistroyka/shared/*` (`ApiClient`, `AuthService`, `ManagerApi`, `WorkerApi`, `SessionStore`, DTOs, `PushRegistrationService`); unit test `SubmitReportBodyTest`.
- **API:** `android_lite` profile is in the Edge allow-list (same path restrictions as `ios_lite`).
- **Pilot:** Android remains behind iOS; treat as iOS-primary. No Android pilot claim without build + device/emulator evidence.

## API contract

- Manager and lite clients use the same `/api/v1` base URL; lite is restricted by path; Manager has full v1 access.
- No breaking mismatch identified at the source level.

## Validation reality (current environment)

- **Web/monorepo suite validated:** `bun install` / `lint` / `build:contracts` / `i18n:check` / `I18N_CHECK_ALL=1 i18n:check` / `test` / `build` / `cf:build` — **PASS, tests 1546/1546**.
- **iOS native build / UITest:** NOT validated here — requires **macOS + Xcode + iOS Simulator**. Local: `ios/scripts/run-ios-uitest-smoke-local.sh`; CI: `.github/workflows/ios-ui-smoke.yml` (login-surface smoke), Layer B live E2E: `.github/workflows/ios-e2e-integration.yml` (`workflow_dispatch`, gitignored pilot credentials).
- **Android native build / instrumented tests:** NOT validated here — requires **Android SDK / Gradle / emulator or device**. CI: `.github/workflows/android-instrumented-smoke.yml`.

## Next evidence required before any pilot claim

- [ ] iOS archive/build evidence (Manager + Worker) on macOS + Xcode.
- [ ] iOS simulator/device smoke (`*SmokeUITests`) or TestFlight evidence.
- [ ] Android Gradle build evidence (Manager + Worker assemble/bundle).
- [ ] Android emulator/device smoke (instrumented launch + shared unit tests) and no-photo-bypass guard green.
- [ ] Backend/API environment confirmation for `/api/v1` (lite allow-list paths; 409 `serverCursor` reconciliation).
- [ ] Deployed web `buildStamp.sha7` if a web/mobile pilot claim depends on web (no deploy assumption from `main` SHA alone).
