# Worker Lite — Current State Map

**Date:** 2025-03-11  
**Branch:** mobile/worker-lite-finalization

## 1. iOS Tree Overview

### 1.1 Two Xcode Projects

| Location | Project | Purpose |
|----------|---------|---------|
| `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | AiStroykaWorker | **Primary.** Contains **two app targets**: (1) AiStroykaWorker = Worker Lite app, (2) AiStroyka Manager = manager app. Worker Lite bundle ID: `POTA.WorkerLite`. |
| `ios/WorkerLite/WorkerLite.xcodeproj` | WorkerLite | **Alternate.** Thin wrapper; all source references point to `../AiStroykaWorker/AiStroykaWorker`. Builds the **same** Worker Lite app. No manager target. |

**Canonical source of truth for Worker Lite:** `ios/AiStroykaWorker/AiStroykaWorker/` (all Swift, plist, entitlements, assets).

### 1.2 Targets (AiStroykaWorker.xcodeproj)

| Target | Type | Product | Bundle ID |
|--------|------|---------|-----------|
| AiStroykaWorker | App | AiStroykaWorker.app | POTA.WorkerLite |
| AiStroyka Manager | App | AiStroyka Manager.app | ai.aistroyka.manager |
| AiStroykaWorkerTests | Unit Test | AiStroykaWorkerTests.xctest | POTA.WorkerLiteTests |
| AiStroykaWorkerUITests | UI Test | AiStroykaWorkerUITests.xctest | POTA.WorkerLiteUITests |

### 1.3 Targets (WorkerLite.xcodeproj)

| Target | Type | Product | Bundle ID (current) |
|--------|------|---------|---------------------|
| AiStroykaWorker | App | AiStroykaWorker.app | **POTA.AistroykaWorker** (typo: wrong casing, inconsistent with main project) |
| AiStroykaWorkerTests | Unit Test | AiStroykaWorkerTests.xctest | POTA.WorkerLiteTests |
| AiStroykaWorkerUITests | UI Test | AiStroykaWorkerUITests.xctest | POTA.WorkerLiteUITests |

WorkerLite project has **no** Manager target; group paths point to `../AiStroykaWorker/...`.

---

## 2. File and Reference Map

### 2.1 Worker Lite App (source: AiStroykaWorker/)

| Category | Path / Notes |
|----------|--------------|
| **Entry** | AiStroykaWorkerApp.swift, AiStroykaWorkerAppDelegate.swift |
| **Root** | RootView.swift, AppState.swift |
| **Core** | Config.swift, APIError.swift, KeychainHelper.swift, DeviceContext.swift, NetworkMonitor.swift |
| **Networking** | APIClient.swift, Endpoints.swift |
| **Services** | AuthService.swift, WorkerAPI.swift, UploadManager.swift, SyncService.swift, BackgroundUploadService.swift, OperationQueueExecutor.swift, Operation.swift, OperationQueueStore.swift, PushRegistrationService.swift, LocalReminderService.swift |
| **Views** | LoginView.swift, HomeContainerView.swift, HomeView.swift, ProjectPickerView.swift, ReportCreateView.swift, TaskDetailView.swift, ImagePicker.swift, CameraPicker.swift |
| **Persistence** | AppStateStore.swift, OperationQueueStore.swift, Operation.swift |
| **Config** | Info.plist, AiStroykaWorker.entitlements |
| **Assets** | Assets.xcassets, Preview Content/Preview Assets.xcassets |
| **Not in target** | **DiagnosticsView.swift** — referenced from HomeView but **not** in Compile Sources → **build blocker**. |
| **Dead** | ContentView.swift — not used; not in target. |

### 2.2 Info.plist (Worker Lite)

- **Path (AiStroykaWorker project):** AiStroykaWorker/Info.plist  
- **Path (WorkerLite project):** ../AiStroykaWorker/AiStroykaWorker/Info.plist  
- **CFBundleDisplayName:** "AiStroyka Worker"  
- **Keys:** BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (from xcconfig/env), NSCameraUsageDescription, NSPhotoLibraryUsageDescription.

### 2.3 Entitlements

- **Path:** AiStroykaWorker/AiStroykaWorker.entitlements  
- WorkerLite project uses: `../AiStroykaWorker/AiStroykaWorker/AiStroykaWorker.entitlements`

### 2.4 Config / Secrets

- **Secrets.xcconfig:** Referenced from both projects as `../Config` (i.e. `ios/Config/`). File not in repo (gitignored). Required for BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY.

### 2.5 Duplicate / Stale Files (WorkerLite/WorkerLite/)

The folder `ios/WorkerLite/WorkerLite/` contains a **subset** of files (e.g. AiStroykaWorkerApp.swift, LoginView.swift, HomeView.swift, Info.plist, …). The **WorkerLite.xcodeproj** does **not** use this folder for the main app target; it uses `path = "../AiStroykaWorker/AiStroykaWorker"`. So `WorkerLite/WorkerLite/` is **stale/duplicate** and can diverge; only the AiStroykaWorker folder is compiled when building from either project.

---

## 3. Naming and Identity Inconsistencies

| Item | AiStroykaWorker project | WorkerLite project | Note |
|------|--------------------------|--------------------|------|
| Project name | AiStroykaWorker | WorkerLite | Different. |
| App target name | AiStroykaWorker | AiStroykaWorker | Same. |
| Product name | $(TARGET_NAME) → AiStroykaWorker | $(TARGET_NAME) → AiStroykaWorker | Same. |
| Bundle ID (app) | POTA.WorkerLite | POTA.AistroykaWorker | **Mismatch + typo** (Aistroyka vs WorkerLite). |
| Display name (Info) | AiStroyka Worker | (same plist) | OK. |
| PBXBuildFile comment | AiStroykaWorkerApp.swift | WorkerLiteApp.swift | Comment-only; fileRef is correct. |

---

## 4. Build Blockers and Risks

1. **DiagnosticsView.swift missing from target**  
   HomeView references `DiagnosticsView()`. DiagnosticsView.swift is **not** in the AiStroykaWorker target’s Compile Sources → **link/compile error** when building.

2. **WorkerLite project bundle ID**  
   `POTA.AistroykaWorker` is inconsistent with the main project (`POTA.WorkerLite`) and has a typo. Should be normalized to `POTA.WorkerLite` for the same app.

3. **Secrets.xcconfig**  
   Not in repo. Build may fail if BASE_URL / Supabase vars are not set (e.g. in Scheme environment). Document required vars.

4. **WorkerLite project Config path**  
   `path = "../Config"` from WorkerLite project dir resolves to `ios/Config`. If opening from a different cwd, path could break. AiStroykaWorker project also uses `path = "../Config"` (relative to project dir).

---

## 5. Manager App (Unchanged)

- **Target:** "AiStroyka Manager" in AiStroykaWorker.xcodeproj only.  
- **Source:** ios/AiStroykaWorker/AiStroykaManager/  
- **Bundle ID:** ai.aistroyka.manager  
- **Not** present in WorkerLite.xcodeproj. No change required for this audit.

---

## 6. API Alignment (Summary)

- **x-client:** APIClient uses `ios_lite` → matches `lite-allow-list.ts` (ios_lite allowed).  
- **Paths:** worker/tasks/today, worker/day/start, worker/day/end, worker/report/*, devices/register, sync/*, media/upload-sessions, config, auth → all in allow list.  
- **Idempotency:** WorkerAPI sends x-idempotency-key where required; backend lite-idempotency accepts ios_lite.

---

## 7. Schemes

- Stored in xcuserdata (user-specific). No shared scheme files listed in inventory. Default scheme names typically match target names (AiStroykaWorker, AiStroyka Manager for main project; AiStroykaWorker for WorkerLite project).
