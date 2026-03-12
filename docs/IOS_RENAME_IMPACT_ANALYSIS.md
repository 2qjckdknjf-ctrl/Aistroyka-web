# iOS Rename Impact Analysis — WorkerLite → AiStroyka Worker / AiStroykaWorker

**Classification of every occurrence for safe rename.**

---

## A. Safe to rename to "AiStroyka Worker" (user-facing)

| Location | Current | Action |
|----------|---------|--------|
| Info.plist (app) | CFBundleName = $(PRODUCT_NAME) → "WorkerLite" | Add CFBundleDisplayName = "AiStroyka Worker"; keep CFBundleName for compatibility or set via build setting |
| Info.plist | NSCameraUsageDescription "Worker Lite needs camera..." | Replace with "AiStroyka Worker needs camera..." |
| Info.plist | NSPhotoLibraryUsageDescription "Worker Lite needs photo library..." | Replace with "AiStroyka Worker needs photo library..." |
| LoginView.swift | Text("Worker Lite") | Replace with Text("AiStroyka Worker") |
| Docs (product name) | "Worker Lite" in reports/ADRs | Update to "AiStroyka Worker" where it refers to the app name |

---

## B. Safe to rename to "AiStroykaWorker" (technical)

| Location | Current | Action |
|----------|---------|--------|
| **project.pbxproj** | | |
| PBXProject name | "WorkerLite" | "AiStroykaWorker" |
| PBXNativeTarget (app) | name = WorkerLite, productName = WorkerLite | AiStroykaWorker |
| PBXNativeTarget (unit) | WorkerLiteTests | AiStroykaWorkerTests |
| PBXNativeTarget (UI) | WorkerLiteUITests | AiStroykaWorkerUITests |
| Product refs | WorkerLite.app, WorkerLiteTests.xctest, WorkerLiteUITests.xctest | AiStroykaWorker.app, AiStroykaWorkerTests.xctest, AiStroykaWorkerUITests.xctest |
| Group names/paths | WorkerLite, WorkerLiteTests, WorkerLiteUITests, path = WorkerLite | AiStroykaWorker, AiStroykaWorkerTests, AiStroykaWorkerUITests, path = AiStroykaWorker |
| INFOPLIST_FILE | WorkerLite/Info.plist | AiStroykaWorker/Info.plist |
| CODE_SIGN_ENTITLEMENTS | WorkerLite/WorkerLite.entitlements | AiStroykaWorker/AiStroykaWorker.entitlements |
| DEVELOPMENT_ASSET_PATHS | "WorkerLite/Preview Content" | "AiStroykaWorker/Preview Content" |
| TEST_HOST | .../WorkerLite.app/.../WorkerLite | .../AiStroykaWorker.app/.../AiStroykaWorker |
| TEST_TARGET_NAME | WorkerLite | AiStroykaWorker |
| remoteInfo | WorkerLite | AiStroykaWorker |
| Build config list comments | PBXProject "WorkerLite", PBXNativeTarget "WorkerLite" | "AiStroykaWorker" |
| File refs (paths) | WorkerLiteApp.swift, WorkerLiteAppDelegate.swift, WorkerLite.entitlements, WorkerLiteTests.swift, WorkerLiteUITests.swift, WorkerLiteUITestsLaunchTests.swift | Rename to AiStroykaWorkerApp.swift, etc. |
| **Source files** | | |
| WorkerLiteApp.swift | struct WorkerLiteApp | Rename file + type to AiStroykaWorkerApp |
| WorkerLiteAppDelegate.swift | class WorkerLiteAppDelegate, Notification.Name | Rename file + class; keep notification name semantic: aiStroykaWorkerPushPayload |
| WorkerLiteTests.swift | @testable import WorkerLite, class WorkerLiteTests | import AiStroykaWorker, class AiStroykaWorkerTests |
| WorkerLiteUITests.swift | class WorkerLiteUITests | class AiStroykaWorkerUITests |
| WorkerLiteUITestsLaunchTests.swift | class WorkerLiteUITestsLaunchTests | class AiStroykaWorkerUITestsLaunchTests |
| **Persistence paths** | | |
| AppStateStore.swift | "WorkerLite" subdir | "AiStroykaWorker" |
| OperationQueueStore.swift | "WorkerLite" subdir | "AiStroykaWorker" |
| BackgroundUploadService.swift | "WorkerLite" subdirs | "AiStroykaWorker" |
| **Folder / project** | | |
| Directory | ios/WorkerLite | ios/AiStroykaWorker |
| Directory | ios/WorkerLite/WorkerLite | ios/AiStroykaWorker/AiStroykaWorker |
| Directory | WorkerLiteTests, WorkerLiteUITests | AiStroykaWorkerTests, AiStroykaWorkerUITests |
| .xcodeproj | WorkerLite.xcodeproj | AiStroykaWorker.xcodeproj |
| **Scheme** | WorkerLite (user scheme) | AiStroykaWorker (will follow target or shared scheme) |
| **ios/BUILD.md** | Paths and scheme "WorkerLite" | Update to AiStroykaWorker paths/scheme |

---

## C. Must probably stay unchanged (avoid breakage)

| Item | Reason |
|------|--------|
| **PRODUCT_BUNDLE_IDENTIFIER** (app) | Preserve **POTA.WorkerLite** for signing, provisioning, App Store continuity. Do not change unless explicitly required. |
| **PRODUCT_BUNDLE_IDENTIFIER** (tests) | Can stay POTA.WorkerLiteTests / POTA.WorkerLiteUITests to avoid reprovisioning test targets; or rename to POTA.AiStroykaWorkerTests — low risk. |
| **Apple Developer portal** | No change to App ID, profiles, or capabilities. |
| **Entitlements content** | Empty dict; capabilities (e.g. push) are in Xcode; no key names to change. |

---

## D. Needs verification after rename

| Item | Check |
|------|--------|
| pbxproj path refs | All paths relative to project dir; after folder rename, paths must be AiStroykaWorker/... |
| Test host / test target | TEST_HOST and TEST_TARGET_NAME must point to new app target name. |
| Scheme file | If shared scheme is added, name it AiStroykaWorker.xcscheme; user scheme may regenerate from target. |
| xcuserdata xcschememanagement.plist | References WorkerLite.xcscheme; after target rename Xcode may recreate scheme; optional to update key to AiStroykaWorker.xcscheme. |
| Config group (../Config) | Unchanged; Secrets.xcconfig path is relative to project; still valid after project rename. |
| Scripts outside ios/ | Grep for WorkerLite or ios/WorkerLite; update if any CI or script invokes xcodebuild with path/scheme. |

---

## Summary

- **A:** Display and permission strings → "AiStroyka Worker".
- **B:** Targets, products, groups, paths, file names, Swift types, persistence subdirs, folder names, .xcodeproj name → "AiStroykaWorker" (or AiStroykaWorkerTests / AiStroykaWorkerUITests).
- **C:** Bundle ID (app) POTA.WorkerLite preserved; test bundle IDs optional to preserve.
- **D:** Verify paths, TEST_HOST, TEST_TARGET_NAME, scheme after rename.

No renames will be applied until this analysis is completed and phases 2–5 are executed in order.
