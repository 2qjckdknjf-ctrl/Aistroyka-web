# Current Mobile State on main (2026-06-26)

Base: `main` @ `9e9d4895bdf990f2fb78768823d046e32caf3841`. Evidence is file presence on `main` only — **not** a runtime/build verification (see `03_VALIDATION_REALITY_2026-06-26.md`).

| Surface | Current evidence on main | Status | Risk | Notes |
|---------|--------------------------|--------|------|-------|
| **iOS Manager** | `ios/AiStroykaManager/AiStroykaManager.xcodeproj`; Views (login, dashboard, projects, project detail, reports inbox, tasks, team, AI tab, copilot chat, settings, onboarding, unauthorized); Services (`ManagerAPI`, `ManagerCopilotService`, `ManagerIntelligenceModels`); UITest target `ManagerSmokeUITests` | Present, source-complete on main | Low (code present) / Medium (no local runtime proof) | Full `/api/v1` access (not in lite allow-list). AI parity matrix: `docs/ai/IOS_MANAGER_AI_PARITY_MATRIX.md` |
| **iOS Worker** | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`; Views (login, home, project picker, report create/resubmit, camera/image picker, task detail, diagnostics, onboarding); Services (`WorkerAPI`, `SyncService`, `UploadManager`, `BackgroundUploadService`, `PushRegistrationService`, `OperationQueueExecutor`, `LocalReminderService`); UITest target `WorkerSmokeUITests` | Present, source-complete on main | Low (code present) / Medium (no local runtime proof) | Offline queue: `docs/runbooks/MOBILE_OFFLINE_QUEUE.md`. Lite allow-list profile (`ios_lite`) |
| **iOS Shared** | `ios/Shared/Sources/Shared/*` (`APIClient`, `AuthService`, `Endpoints`, `KeychainHelper`, `Config`, `DeviceContext`, `NetworkMonitor`, `CopilotSSEClient`, `E2EAutoSignIn`, `MobileClientProfile`, …) | Present | Low | Local Swift package consumed by both apps |
| **Android Manager** | `android/AiStroykaManager/` (`build.gradle.kts`, `MainActivity`, `ManagerViewModel`, `ManagerApplication`, Compose `ui/*` theme/app) | Present (Compose scaffold) | Medium | UI surface thinner than iOS Manager; parity gap vs iOS |
| **Android Worker** | `android/AiStroykaWorker/` (`build.gradle.kts`, `MainActivity`, `WorkerViewModel`, `WorkerApplication`, `WorkerFirebaseMessagingService`, Compose `ui/*`); instrumented `WorkerAppLaunchInstrumentedTest` | Present (Compose scaffold) | Medium | Release no-photo-bypass guard script: `scripts/android/verify-worker-release-no-photo-bypass.sh` |
| **Android Shared** | `android/shared/src/main/java/ai/aistroyka/shared/*` (`ApiClient`, `AuthService`, `ManagerApi`, `WorkerApi`, `SessionStore`, DTOs, `PushRegistrationService`, …); unit test `SubmitReportBodyTest` | Present | Low | Mirrors iOS Shared responsibilities |
| **Shared API / auth / session** | iOS `APIClient`/`AuthService`/`KeychainHelper`; Android `ApiClient`/`AuthService`/`SessionStore`; both target `/api/v1`; lite profiles gated by `apps/web/lib/api/lite-allow-list.ts` in Edge `middleware.ts` | Present, aligned to v1 | Low/Medium | 409 conflict reconciliation via `serverCursor` per `docs/runbooks/MOBILE_SYNC.md` |
| **Mobile pilot docs / tests** | iOS UITest smoke (`ios-ui-smoke.yml`) + Layer B E2E (`ios-e2e-integration.yml`, gitignored creds); Android `test`/`androidTest`; many `docs/mobile-*`, `docs/ios-manager/*`, `docs/release1/WAVE3_*` reports | Present but partly **stale** | Medium | `docs/release-hardening/MOBILE_PILOT_READINESS.md` claims "Android: No app in repo" — **no longer true** |

## Known mobile flows (source-level presence)
- **Login / session:** iOS (`LoginView`/`ManagerLoginView` + `AuthService`/`KeychainHelper`); Android (`AuthService`/`SessionStore`). Present.
- **Worker report creation + before/after photos:** iOS `ReportCreateView`/`CameraPicker`/`ImagePicker`/`UploadManager`. Present.
- **Submit / sync (offline queue):** iOS `SyncService`/`BackgroundUploadService`/`OperationQueueExecutor`. Present.
- **Manager inbox + review (approve/reject/changes_requested):** iOS `ReportsInboxView`; resubmit path `ReportResubmitView`. Present.
- **Manager AI (per-project intelligence + copilot SSE):** iOS `ProjectIntelligenceView`/`ProjectCopilotChatView`/`AITabView` + `CopilotSSEClient`. Present.
- **Deep links / navigation:** iOS `ManagerTabShell`/`HomeContainerView`; `docs/ios-manager/DASHBOARD_DEEP_LINKS.md`. Present.
- **Pilot tags / test IDs:** iOS `UITestLaunchHooks`/`ManagerUITestLaunchHooks`, `pilot_*` ids referenced by smoke UITests. Present.

## Parity observation
- **iOS is the more complete contour** (rich Manager + Worker view sets). **Android is a Compose scaffold** with shared API/DTO layer and minimal UI — consistent with the "iOS-primary, defer broad Android parity" stance. This parity gap is expected, not a regression.
