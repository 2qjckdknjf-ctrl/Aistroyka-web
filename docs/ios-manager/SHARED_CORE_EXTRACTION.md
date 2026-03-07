# Shared Core Extraction (Manager + Worker)

**Date:** 2026-03-07

---

## Current approach (Phase 1)

Shared code is **reused by target membership**: the same source files (under `AiStroykaWorker/`) are compiled into both the Worker and the Manager target. No separate Shared framework yet.

## Classification

### Reused as-is (in both targets)

| File | Purpose |
|------|--------|
| `Core/APIError.swift` | API error type and parsing |
| `Core/Config.swift` | BASE_URL, Supabase URL/anon key, apiBaseURL |
| `Core/DeviceContext.swift` | Device ID for x-device-id header |
| `Core/KeychainHelper.swift` | Session token/user id storage |
| `Core/NetworkMonitor.swift` | Network reachability |
| `Networking/APIClient.swift` | HTTP client, token provider, x-device-id, x-client |
| `Networking/Endpoints.swift` | DTOs: ProjectDTO, TaskDTO, ConfigResponse, etc. |
| `Services/AuthService.swift` | Supabase sign-in, session, getAccessToken |

### Worker-only (not in Manager target)

- `WorkerAPI.swift`, `UploadManager.swift`, `SyncService.swift`, `BackgroundUploadService.swift`, `OperationQueueExecutor.swift`, `PushRegistrationService.swift`, `LocalReminderService.swift`
- `Persistence/`: AppStateStore, Operation, OperationQueueStore
- `AppState.swift`, `RootView.swift`, `AiStroykaWorkerApp.swift`, `AiStroykaWorkerAppDelegate.swift`
- All Views under AiStroykaWorker (LoginView, HomeView, ReportCreateView, etc.)

### Manager-only

- Everything under `AiStroykaManager/`: AiStroykaManagerApp, ManagerSessionState, ManagerRootView, Views/* (ManagerLoginView, ManagerTabShell, HomeDashboardView, etc.).
- Manager-specific API layer (e.g. ManagerAPI for GET /api/v1/tasks, reports, projects, workers, ops/overview) to be added; currently placeholders.

### Refactored into shared (future)

- **Session/tenant:** Backend may expose role; a shared “SessionContext” or “TenantContext” could be used by both apps.
- **x-client:** APIClient could take a client profile (ios_lite vs ios_manager) from a shared config or compile flag.

### Missing / backend gaps

- **Manager API module:** Dedicated ManagerAPI or “Engine” client for GET /api/v1/projects, tasks, reports, workers, ops/overview, org/metrics. To be implemented with real endpoints; placeholders in place.
- **Role/tenant from API:** GET /api/v1/me or tenant context to drive role gating (manager/owner/admin) in Manager app.
- **AI/notifications:** Manager screens for AI and notifications are placeholders until backend contracts are confirmed.

---

## Target structure (current)

```
ios/AiStroykaWorker/
  AiStroykaWorker.xcodeproj
  AiStroykaWorker/          # Worker app + shared sources
    Core/                   # shared with Manager
    Networking/             # shared with Manager
    Services/               # AuthService shared; rest Worker-only
    Persistence/            # Worker-only
    Views/                  # Worker-only
    ...
  AiStroykaManager/         # Manager app only
    AiStroykaManagerApp.swift
    ManagerSessionState.swift
    ManagerRootView.swift
    Views/
    Info.plist
    Assets.xcassets
  Config/                   # Shared config (both reference ../Config)
```

Future option: add `Shared/` group (or an AiStroykaShared framework target) and move Core, Networking, AuthService there; both app targets would depend on Shared.
