# Worker Lite — Identity Normalization

**Date:** 2025-03-11  
**Branch:** mobile/worker-lite-finalization

## 1. Canonical Identity (Final)

Worker Lite is a **single coherent app** with this identity:

| Item | Value |
|------|--------|
| **Target name** | AiStroykaWorker |
| **Product name** | AiStroykaWorker (via $(TARGET_NAME)) |
| **Product output** | AiStroykaWorker.app |
| **Bundle identifier** | POTA.WorkerLite |
| **Display name (user-facing)** | AiStroyka Worker |
| **Scheme** | AiStroykaWorker (when using AiStroykaWorker.xcodeproj) |
| **Source folder** | ios/AiStroykaWorker/AiStroykaWorker/ |
| **x-client header** | ios_lite |

**Recommendation:** Build and run Worker Lite from **ios/AiStroykaWorker/AiStroykaWorker.xcodeproj** (select scheme **AiStroykaWorker**). The WorkerLite.xcodeproj is an alternate project that compiles the same source; both projects now use the same bundle ID for the app.

## 2. Normalization Applied

- **Bundle ID (WorkerLite.xcodeproj):** `POTA.AistroykaWorker` → `POTA.WorkerLite` in Debug and Release so both Xcode projects produce the same app identity.
- **PBXBuildFile comment (WorkerLite.xcodeproj):** "WorkerLiteApp.swift in Sources" → "AiStroykaWorkerApp.swift in Sources" to match the actual file reference (no file rename; project reference was already correct).
- **DiagnosticsView.swift:** Added to the AiStroykaWorker target (file reference + Compile Sources) so the app builds (HomeView references it).

## 3. What Was Not Changed (By Design)

- **No filesystem renames** of app source files or folders (avoids breaking Xcode references).
- **Manager app** (AiStroyka Manager target, ai.aistroyka.manager) untouched.
- **Info.plist** CFBundleDisplayName left as "AiStroyka Worker" (already correct).
- **WorkerLite/WorkerLite/** duplicate folder left on disk; it is not used by WorkerLite.xcodeproj (which points to ../AiStroykaWorker/AiStroykaWorker). Optional follow-up: remove or archive that folder after confirming builds.

## 4. Test Targets

- **AiStroykaWorkerTests:** product AiStroykaWorkerTests.xctest, bundle ID POTA.WorkerLiteTests, TEST_HOST = AiStroykaWorker.app.
- **AiStroykaWorkerUITests:** product AiStroykaWorkerUITests.xctest, bundle ID POTA.WorkerLiteUITests, TEST_TARGET_NAME = AiStroykaWorker.

No changes made to test target names or bundle IDs.
