# iOS Manager — Architecture Decision

**Date:** 2026-03-07  
**Scope:** New primary iOS app "AiStroyka Manager" for manager/owner/admin/foreman roles, connected to the common engine.

---

## 1. Audit Summary

### 1.1 Current Xcode layout

- **Workspace:** No repo-level shared workspace. Each app uses the default single-project workspace (`project.xcworkspace` inside the project directory).
- **Project:** `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`
- **Project directory:** `ios/AiStroykaWorker/` (project root); app source lives in `AiStroykaWorker/` (group path `AiStroykaWorker`).
- **Config:** Shared `ios/Config/` with `Config.example.xcconfig` and optional `Secrets.xcconfig`; referenced from project as `../Config` (group path `../Config`).

### 1.2 Existing iOS app target(s)

| Target              | Type   | Product        | Bundle ID        | Scheme   |
|---------------------|--------|----------------|-------------------|----------|
| AiStroykaWorker     | App    | AiStroykaWorker.app | POTA.WorkerLite   | AiStroykaWorker |
| AiStroykaWorkerTests| Unit   | .xctest        | POTA.WorkerLiteTests  | (same) |
| AiStroykaWorkerUITests | UI  | .xctest        | POTA.WorkerLiteUITests | (same) |

### 1.3 Worker app structure (current)

- **Entry:** `AiStroykaWorkerApp.swift` (@main), `AiStroykaWorkerAppDelegate.swift`
- **Core:** APIError, Config, DeviceContext, KeychainHelper, NetworkMonitor
- **Networking:** APIClient, Endpoints (DTOs + worker endpoints)
- **Services:** AuthService, UploadManager, WorkerAPI, SyncService, OperationQueueExecutor, BackgroundUploadService, PushRegistrationService, LocalReminderService
- **Persistence:** AppStateStore, Operation, OperationQueueStore
- **Views:** LoginView, HomeContainerView, HomeView, ProjectPickerView, ReportCreateView, TaskDetailView, ImagePicker, CameraPicker
- **State:** AppState, RootView

All of the above are in a single target; no shared framework or second app.

### 1.4 Shared code candidates

Suitable for both Worker and Manager (auth, tenant, API, config, errors):

- Config, APIError, KeychainHelper, DeviceContext, NetworkMonitor
- APIClient (with token provider), Endpoints (DTOs: ProjectDTO, TaskDTO, etc.)
- AuthService
- Environment/config (BASE_URL, Supabase URL/anon key)

Worker-only (no Manager reuse):

- WorkerAPI (worker/day, worker/tasks/today, worker/report/*, sync/*, devices/register)
- AppStateStore, Operation, OperationQueueStore, OperationQueueExecutor, BackgroundUploadService, PushRegistrationService, LocalReminderService
- UploadManager (worker upload flow)
- Views: LoginView (can share), HomeContainerView, HomeView, ProjectPickerView, ReportCreateView, TaskDetailView, ImagePicker, CameraPicker

### 1.5 Dependencies to backend/engine

- **Auth:** Supabase Auth (REST: token?grant_type=password); session in Keychain.
- **API base:** `BASE_URL/api/v1` (e.g. https://aistroyka.ai/api/v1).
- **Worker endpoints used today:** config, projects, worker/tasks/today, worker/day/start|end, worker/report/create|add-media|submit, media/upload-sessions, sync/bootstrap|changes|ack, devices/register.
- **Manager-relevant backend (existing):** GET/POST /api/v1/tasks, GET /api/v1/tasks/:id, POST /api/v1/tasks/:id/assign, GET /api/v1/reports, GET /api/v1/reports/:id, GET /api/v1/projects (and /api/v1/projects/:id), GET /api/v1/workers, GET /api/v1/ops/overview, GET /api/v1/org/metrics/overview, GET /api/v1/devices, GET /api/v1/projects/:id/ai, admin/analytics, etc.

---

## 2. Options Considered

### A) Same Xcode project + additional target

- Add a second app target "AiStroyka Manager" to `AiStroykaWorker.xcodeproj`.
- Manager source in a new group/folder (e.g. `AiStroykaManager/`) alongside `AiStroykaWorker/`.
- Shared code: same source files included in both targets (target membership), or a shared framework target.

**Pros:** One project, one place for build settings and schemes; easy to add shared files to both targets; no workspace wiring.  
**Cons:** Project name stays "AiStroykaWorker"; possible to accidentally add Worker-only file to Manager (mitigated by clear folders and membership).

### B) Separate Xcode project inside same workspace

- Create `ios/AiStroykaManager/AiStroykaManager.xcodeproj` (or similar).
- Create `ios/AiStroyka.xcworkspace` including both projects.
- Shared code: shared framework (e.g. AiStroykaShared) or duplicate files.

**Pros:** Clear separation of apps; project names match products.  
**Cons:** Need to introduce and maintain a workspace; shared code requires a framework or duplication; more moving parts.

---

## 3. Decision

**Chosen: A) Same Xcode project + additional target.**

- **Workspace:** Keep current (single-project workspace); no new workspace file.
- **Project:** `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` (unchanged path; name can be revisited later if desired).
- **New target:** "AiStroyka Manager" (product name: AiStroyka Manager, bundle id: `ai.aistroyka.manager`).
- **Shared code:** Use **target membership** only initially: shared source files (Config, APIError, KeychainHelper, DeviceContext, NetworkMonitor, APIClient, Endpoints, AuthService) are built in both targets. No new framework target for Phase 1.
- **Manager-only:** New group `AiStroykaManager/` with app entry, Manager views, Manager-specific services (e.g. ManagerAPI for tasks/reports/ops/workers).
- **Worker-only:** Existing `AiStroykaWorker/` group remains; no files removed from Worker target.

**Reasoning:**

1. Repo has no existing shared workspace; adding a second target is simpler than adding a workspace + second project.
2. User preference: "same workspace + same project + separate target."
3. Shared code is modest (config, auth, API client, DTOs); dual target membership is sufficient and avoids framework overhead for now.
4. Clear separation: Manager and Worker are different targets and different app bundles; role gating and UX stay in their own layers.
5. Future: If shared code grows, we can introduce an "AiStroykaShared" framework target in the same project and move shared files there.

---

## 4. Resulting structure (target)

```
ios/
  Config/                          # Shared config (both targets reference)
  AiStroykaWorker/
    AiStroykaWorker.xcodeproj      # One project
    AiStroykaWorker/               # Worker app (existing)
      AiStroykaWorkerApp.swift
      ...
    AiStroykaManager/              # Manager app (new)
      AiStroykaManagerApp.swift
      Info.plist
      Assets.xcassets
      Views/
      ...
    Shared/                        # (Optional later) or shared via target membership from Worker folders
```

Shared sources (built in both targets): Core (Config, APIError, KeychainHelper, DeviceContext, NetworkMonitor), Networking (APIClient, Endpoints), AuthService. Manager gets its own ManagerAPI, navigation, and screens.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|------|-------------|
| Accidental Worker file in Manager target | Clear group boundaries; review target membership when adding files. |
| Config/Secrets.xcconfig path | Manager target uses same baseConfigurationReference (../Config/Secrets.xcconfig) or Info.plist env. |
| Two @main in one target | Impossible: each target has its own module; Manager target has only AiStroykaManagerApp.swift as @main. |

---

**Next:** Create new target and app shell (see XCODE_TARGET_SETUP.md).
