# Code Migration Report

**Date:** 2026-03-12  
**Project:** AISTROYKA mobile rebuild

---

## 1. Source of existing code

- **iOS:** Previous implementation lives in **`ios/Архив.zip`**. Structure inside zip: one Xcode project with two targets (AiStroykaWorker, AiStroyka Manager); Worker source under `AiStroykaWorker/AiStroykaWorker/`, Manager under `AiStroykaWorker/AiStroykaManager/`, shared code compiled into both via target membership.

---

## 2. Reusable areas (from archive / docs)

| Area | Location in archive | Target in new structure |
|------|---------------------|-------------------------|
| APIError, Config, DeviceContext, KeychainHelper, NetworkMonitor | Core/ | ios/Shared/Sources/Shared/ |
| APIClient, Endpoints (DTOs) | Networking/ | ios/Shared/Sources/Shared/ |
| AuthService | Services/ | ios/Shared/Sources/Shared/ |
| Worker app entry, RootView, AppState, Worker views, WorkerAPI, UploadManager, SyncService, BackgroundUploadService, persistence | AiStroykaWorker/ | ios/AiStroykaWorker/AiStroykaWorker/ |
| Manager app entry, ManagerRootView, Manager views, ManagerAPI | AiStroykaManager/ | ios/AiStroykaManager/AiStroykaManager/ |

---

## 3. Migration steps

1. **Extract** `ios/Архив.zip` to a temp directory.
2. **Copy** Shared-type sources (Core, Networking, AuthService) into `ios/Shared/Sources/Shared/` and adjust `Package.swift` if new files are added.
3. **Copy** Worker-only sources into `ios/AiStroykaWorker/AiStroykaWorker/` and add them to the AiStroykaWorker Xcode project (or replace placeholder Swift files).
4. **Copy** Manager-only sources into `ios/AiStroykaManager/AiStroykaManager/` and add to the AiStroykaManager project.
5. **Remove** naming confusion: ensure no "WorkerLite" in user-facing strings, target names, or scheme names; keep bundle ID migration optional (see LEGACY_CLEANUP_REPORT).
6. **Android:** No existing Android code; bootstrap created from scratch. Shared logic (auth, API client, DTOs) to be implemented in `android/shared` aligned with `shared/contracts` and `packages/contracts`.

---

## 4. What not to do

- **Do not** duplicate backend domain logic in mobile; call APIs only.
- **Do not** put Worker-only code in Manager app or Manager-only code in Worker app.
- **Do not** leave shared logic in app-specific folders; move to ios/Shared or android/shared.

---

## 5. Deprecated / archive

- **WorkerLite** as product/target/scheme name: deprecated; use AiStroykaWorker.
- **Single Xcode project containing both apps:** superseded by two separate projects; archive project file can be kept for reference.
- **Stale WorkerLite/WorkerLite/ folder** (if present after extract): do not use; treat as legacy.

---

## 6. Current bootstrap state

- **iOS:** New clean projects and Shared package created; placeholder app entry and root views. Migration from archive is **not yet run**; run the steps above to bring over full implementation.
- **Android:** New modules and shared library created; placeholder Compose UI. No prior Android code to migrate.
