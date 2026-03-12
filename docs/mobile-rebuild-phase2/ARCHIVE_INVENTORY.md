# Archive Inventory — ios/Архив.zip

**Date:** 2026-03-12  
**Phase:** Mobile Rebuild Phase 2

---

## 1. Archive layout (extracted)

- **AiStroykaWorker/** — Main folder (single Xcode project with two app targets)
  - **AiStroykaWorker.xcodeproj** — One project, targets: AiStroykaWorker (app), AiStroyka Manager (app), AiStroykaWorkerTests, AiStroykaWorkerUITests
  - **AiStroykaWorker/** — Worker app source + shared source (same directory; shared files compiled into both targets via membership)
  - **AiStroykaManager/** — Manager app source only
  - **Info.plist** — Root-level (legacy)
- **WorkerLite/** — Alternate Xcode project (thin wrapper; points at AiStroykaWorker sources). **Not used for migration.**
- **Config/** — Secrets.xcconfig, Config.example.xcconfig, README (both apps reference ../Config)

---

## 2. Shared files (→ ios/Shared/Sources/Shared/)

Used by both Worker and Manager in archive (target membership). Reusable logic.

| File | Purpose |
|------|---------|
| Core/APIError.swift | API error type and parsing |
| Core/Config.swift | baseURL, supabaseURL, supabaseAnonKey, apiBaseURL |
| Core/DeviceContext.swift | Device ID (Keychain), idempotency key generation |
| Core/KeychainHelper.swift | Keychain get/set/delete, deviceId/session keys |
| Core/NetworkMonitor.swift | NWPathMonitor, isConnected, onBecameReachable |
| Networking/APIClient.swift | HTTP client, token provider, x-device-id, x-client |
| Networking/Endpoints.swift | DTOs: ConfigResponse, ProjectDTO, TaskDTO, Sync*, etc. |
| Services/AuthService.swift | Supabase sign-in, session, getAccessToken, signOut |

APIClient uses private EmptyJSON and AnyEncodable; these move into Shared (public or internal).

---

## 3. Worker-only files (→ ios/AiStroykaWorker/AiStroykaWorker/)

| Category | Files |
|----------|--------|
| App entry | AiStroykaWorkerApp.swift, AiStroykaWorkerAppDelegate.swift |
| State / root | AppState.swift, RootView.swift |
| Persistence | Persistence/AppStateStore.swift, Operation.swift, OperationQueueStore.swift |
| Services | WorkerAPI.swift, UploadManager.swift, SyncService.swift, BackgroundUploadService.swift, OperationQueueExecutor.swift, PushRegistrationService.swift, LocalReminderService.swift |
| Views | LoginView.swift, HomeContainerView.swift, HomeView.swift, ProjectPickerView.swift, ReportCreateView.swift, TaskDetailView.swift, ImagePicker.swift, CameraPicker.swift, DiagnosticsView.swift |
| Dead | ContentView.swift (not used; optional to migrate) |
| Config / assets | Info.plist, AiStroykaWorker.entitlements, Assets.xcassets, Preview Content/Preview Assets.xcassets |

---

## 4. Manager-only files (→ ios/AiStroykaManager/AiStroykaManager/)

| Category | Files |
|----------|--------|
| App entry | AiStroykaManagerApp.swift |
| State | ManagerSessionState.swift, ManagerRootView.swift |
| Services | Services/ManagerAPI.swift |
| Design | Design/EmptyStateView.swift, ErrorStateView.swift, KPICard.swift, LoadingStateView.swift, SectionHeaderView.swift |
| Views | ManagerLoginView.swift, ManagerUnauthorizedView.swift, ManagerTabShell.swift, HomeDashboardView.swift, ProjectsListView.swift, ProjectDetailView.swift, TasksListPlaceholderView.swift, TasksListView.swift, ReportsInboxPlaceholderView.swift, ReportsInboxView.swift, TeamOverviewPlaceholderView.swift, TeamOverviewView.swift, AICopilotPlaceholderView.swift, AITabView.swift, ManagerMoreView.swift, ManagerSettingsView.swift, NotificationsPlaceholderView.swift, NotificationsView.swift |
| Config / assets | Info.plist, Assets.xcassets |

---

## 5. Config / assets / plists

| Item | Location in archive | Action |
|------|---------------------|--------|
| Worker Info.plist | AiStroykaWorker/AiStroykaWorker/Info.plist | Migrate to Worker app |
| Manager Info.plist | AiStroykaWorker/AiStroykaManager/Info.plist | Migrate to Manager app |
| Worker entitlements | AiStroykaWorker/AiStroykaWorker/AiStroykaWorker.entitlements | Migrate to Worker app |
| Worker Assets | AiStroykaWorker/AiStroykaWorker/Assets.xcassets | Migrate to Worker app |
| Manager Assets | AiStroykaWorker/AiStroykaManager/Assets.xcassets | Migrate to Manager app |
| Config (xcconfig) | Config/Secrets.xcconfig, Config.example.xcconfig | Optional: copy to ios/Config or document |

---

## 6. Services summary

- **Shared:** AuthService (Supabase auth, session, keychain).
- **Worker:** WorkerAPI, UploadManager, SyncService, BackgroundUploadService, OperationQueueExecutor, PushRegistrationService, LocalReminderService.
- **Manager:** ManagerAPI (projects, tasks, reports, workers, ops/overview).

---

## 7. Networking / persistence / upload–sync–background

- **Networking:** APIClient, Endpoints (Shared); WorkerAPI, ManagerAPI (app-specific).
- **Persistence:** AppStateStore, Operation, OperationQueueStore (Worker only).
- **Upload/sync/background:** UploadManager, SyncService, BackgroundUploadService, OperationQueueExecutor (Worker only).
