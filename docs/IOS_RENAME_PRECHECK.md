# iOS Rename Precheck — WorkerLite → AiStroyka Worker / AiStroykaWorker

**Branch:** `chore/rename-workerlite-to-aistroykaworker`  
**Date:** 2026-03-07  
**Snapshot before any rename.**

---

## 1. Current state

| Item | Value |
|------|--------|
| **Project name** | WorkerLite (PBXProject "WorkerLite") |
| **xcodeproj name** | WorkerLite.xcodeproj |
| **Workspace** | project.xcworkspace (single-project; no .xcworkspace at repo level) |
| **Project location** | ios/WorkerLite/WorkerLite.xcodeproj |

### Targets

| Target | Type | Product | Bundle ID |
|--------|------|---------|-----------|
| WorkerLite | Application | WorkerLite.app | POTA.WorkerLite |
| WorkerLiteTests | Unit Test | WorkerLiteTests.xctest | POTA.WorkerLiteTests |
| WorkerLiteUITests | UI Test | WorkerLiteUITests.xctest | POTA.WorkerLiteUITests |

### Schemes

- **WorkerLite** (default; referenced in xcschememanagement.plist under xcuserdata).
- No shared scheme in xcshareddata; scheme name follows main target.

### Display / product names

- **CFBundleName** in Info.plist: `$(PRODUCT_NAME)` → resolves to **WorkerLite** (TARGET_NAME).
- **CFBundleDisplayName**: not set → falls back to CFBundleName → **WorkerLite**.
- **PRODUCT_NAME** (build setting): `$(TARGET_NAME)` → **WorkerLite** for app target.

### Plist and entitlements

| File | Location |
|------|----------|
| Info.plist (app) | WorkerLite/WorkerLite/Info.plist (INFOPLIST_FILE = WorkerLite/Info.plist relative to project dir) |
| Info.plist (root) | WorkerLite/Info.plist (not used by target; legacy?) |
| Entitlements | WorkerLite/WorkerLite/WorkerLite.entitlements (CODE_SIGN_ENTITLEMENTS = WorkerLite/WorkerLite.entitlements) |

### Source roots and key paths

- **App source root:** ios/WorkerLite/WorkerLite/ (group path = WorkerLite)
- **Test roots:** WorkerLiteTests/, WorkerLiteUITests/
- **Assets:** WorkerLite/Assets.xcassets, WorkerLite/Preview Content/Preview Assets.xcassets
- **Development assets:** DEVELOPMENT_ASSET_PATHS = "WorkerLite/Preview Content"

### Build settings (app target)

- CODE_SIGN_ENTITLEMENTS = WorkerLite/WorkerLite.entitlements
- INFOPLIST_FILE = WorkerLite/Info.plist
- PRODUCT_BUNDLE_IDENTIFIER = POTA.WorkerLite
- PRODUCT_NAME = $(TARGET_NAME)

### Test targets

- WorkerLiteTests: TEST_HOST = $(BUILT_PRODUCTS_DIR)/WorkerLite.app/.../WorkerLite
- WorkerLiteUITests: TEST_TARGET_NAME = WorkerLite

### xcconfig

- Base: Config/Secrets.xcconfig (baseConfigurationReference; path ../Config/Secrets.xcconfig from project)

### Hardcoded / runtime references to "WorkerLite"

| Location | Usage |
|----------|--------|
| WorkerLiteApp.swift | struct WorkerLiteApp, @UIApplicationDelegateAdaptor(WorkerLiteAppDelegate.self) |
| WorkerLiteAppDelegate.swift | class WorkerLiteAppDelegate, Notification.Name("WorkerLitePushPayload") |
| WorkerLiteTests.swift | @testable import WorkerLite, class WorkerLiteTests |
| WorkerLiteUITests.swift | class WorkerLiteUITests |
| WorkerLiteUITestsLaunchTests.swift | class WorkerLiteUITestsLaunchTests |
| LoginView.swift | Text("Worker Lite") |
| Info.plist | NSCameraUsageDescription, NSPhotoLibraryUsageDescription: "Worker Lite needs..." |
| AppStateStore.swift | dir.appendingPathComponent("WorkerLite", isDirectory: true) |
| OperationQueueStore.swift | dir.appendingPathComponent("WorkerLite", isDirectory: true) |
| BackgroundUploadService.swift | appendingPathComponent("WorkerLite", ...) (2 places) |

### Docs / scripts referencing WorkerLite or paths

- ios/BUILD.md
- docs/ADR/005-worker-lite-scope.md
- docs/REPORT-PHASE7-*.md, docs/REPORT-PROD-*.md, docs/IOS_BUILD_WARNINGS_FIX_REPORT.md
- docs/operations/PILOT_MODE_CONFIG.md
- Multiple other docs (product name "Worker Lite" or path "ios/WorkerLite")

---

## 2. Search summary: WorkerLite / Worker Lite

- **project.pbxproj:** target names, product names, paths, file refs, remoteInfo, TEST_HOST, TEST_TARGET_NAME, build config list comments.
- **Swift source:** file headers, struct/class names, Notification.Name, @testable import, path components "WorkerLite".
- **Info.plist:** no CFBundleDisplayName; CFBundleName = $(PRODUCT_NAME); permission strings "Worker Lite ...".
- **Entitlements:** path WorkerLite.entitlements only (content empty dict).
- **xcschememanagement.plist:** WorkerLite.xcscheme_^#shared#^_.
- **Config:** no WorkerLite in Config.example.xcconfig or README.

---

## 3. Bundle identifier and signing

- **App:** POTA.WorkerLite (preserve unless strong reason to change).
- **Tests:** POTA.WorkerLiteTests, POTA.WorkerLiteUITests (can rename to POTA.AiStroykaWorkerTests etc. or keep for continuity).
- **Entitlements:** WorkerLite.entitlements (empty dict; push/aps configured via capability in Xcode; file path will change with rename).
- **Team:** DEVELOPMENT_TEAM = 43A4KW5BKB (preserve).

---

## 4. Risk notes

- Renaming the **folder** ios/WorkerLite and the **.xcodeproj** requires updating every path in pbxproj and any scripts/docs.
- **Module name** is derived from the product/target name by default; renaming target to AiStroykaWorker will make the Swift module AiStroykaWorker, so `@testable import WorkerLite` must become `@testable import AiStroykaWorker`.
- **Persistence paths** (Application Support/WorkerLite/...) are hardcoded in AppStateStore, OperationQueueStore, BackgroundUploadService; changing to AiStroykaWorker will use a new directory (old data not migrated automatically; acceptable for rename).
