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

- **Status:** Android apps **are present** as a **buildable engineering foundation**. First pilot remains **web + iOS**; Android is **deferred** (P3 Option A; Phase 6 YES — DEFERRED, 2026-07-30).
  - **Android Manager:** Compose scaffold (`MainActivity`, `ManagerViewModel`, `ManagerApplication`, `ui/*`). UI **thinner than iOS Manager** — expected under iOS-primary stance.
  - **Android Worker:** Compose scaffold + `WorkerFirebaseMessagingService` (FCM compile wiring) + instrumented launch test. Release no-photo-bypass guard: `scripts/android/verify-worker-release-no-photo-bypass.sh`.
  - **Android Shared:** `android/shared/...` (`ApiClient`, `AuthService`, `ManagerApi`, `WorkerApi`, `SessionStore`, DTOs, `PushRegistrationService`, brand tokens); shared unit tests PASS.
- **API:** Worker uses `android_worker` (lite allow-list with `ios_worker` / `*_lite`); Manager uses `android_manager` (not lite-restricted).
- **Phase 6 evidence (2026-07-30):** `:shared:test` + Worker/Manager `assembleDebug` + `lintDebug` + brand-drift + photo-bypass guard **PASS**. Emulator/device smoke, live FCM, signed Play upload **not claimed**.
- **Pilot:** Android Worker/Manager are **not** promised to first-pilot users. No Google Play / offline-first / live-FCM readiness claim. Revisit only on owner/client mandate.

## API contract

- Manager and lite clients use the same `/api/v1` base URL; lite is restricted by path; Manager has full v1 access.
- No breaking mismatch identified at the source level.

## Validation reality (current environment)

- **Web/monorepo suite validated:** `bun install` / `lint` / `build:contracts` / `i18n:check` / `I18N_CHECK_ALL=1 i18n:check` / `test` / `build` / `cf:build` — **PASS, tests 1546/1546**.
- **iOS native build / UITest:** NOT validated here — requires **macOS + Xcode + iOS Simulator**. Local: `ios/scripts/run-ios-uitest-smoke-local.sh`; CI: `.github/workflows/ios-ui-smoke.yml` (login-surface smoke), Layer B live E2E: `.github/workflows/ios-e2e-integration.yml` (`workflow_dispatch`, gitignored pilot credentials).
- **Android Debug build / shared unit tests / lintDebug:** validated in Phase 6 deferred track (2026-07-30) — **PASS** (not pilot/Play proof). Instrumented/emulator/device smoke: **NOT_IN_SCOPE** for deferred track. CI workflow exists: `.github/workflows/android-instrumented-smoke.yml`.

## Next evidence required before any pilot claim

- [ ] iOS archive/device/TestFlight evidence as required by pilot ops (Phase 5 closed simulator Layer B; physical device / TestFlight still external).
- [ ] Android Gradle Debug evidence — **done for deferred track** (Phase 6); does **not** authorize Android pilot.
- [ ] Android emulator/device smoke + Play internal — only if owner authorizes Android readiness track (not first-pilot default).
- [ ] Backend/API environment confirmation for `/api/v1` (lite allow-list paths; 409 `serverCursor` reconciliation).
- [ ] Deployed web `buildStamp.sha7` if a web/mobile pilot claim depends on web (no deploy assumption from `main` SHA alone).
