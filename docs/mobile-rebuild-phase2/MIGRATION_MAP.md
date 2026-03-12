# Migration Map — Old path → New path

**Date:** 2026-03-12  
**Source:** Extracted ios/Архив.zip (AiStroykaWorker/ = root)

---

## Shared → ios/Shared/Sources/Shared/

| Old path | New path |
|----------|----------|
| AiStroykaWorker/AiStroykaWorker/Core/APIError.swift | ios/Shared/Sources/Shared/APIError.swift |
| AiStroykaWorker/AiStroykaWorker/Core/Config.swift | ios/Shared/Sources/Shared/Config.swift |
| AiStroykaWorker/AiStroykaWorker/Core/DeviceContext.swift | ios/Shared/Sources/Shared/DeviceContext.swift |
| AiStroykaWorker/AiStroykaWorker/Core/KeychainHelper.swift | ios/Shared/Sources/Shared/KeychainHelper.swift |
| AiStroykaWorker/AiStroykaWorker/Core/NetworkMonitor.swift | ios/Shared/Sources/Shared/NetworkMonitor.swift |
| AiStroykaWorker/AiStroykaWorker/Networking/APIClient.swift | ios/Shared/Sources/Shared/APIClient.swift |
| AiStroykaWorker/AiStroykaWorker/Networking/Endpoints.swift | ios/Shared/Sources/Shared/Endpoints.swift |
| AiStroykaWorker/AiStroykaWorker/Services/AuthService.swift | ios/Shared/Sources/Shared/AuthService.swift |

---

## Worker → ios/AiStroykaWorker/AiStroykaWorker/

| Old path | New path |
|----------|----------|
| AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerApp.swift | ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerApp.swift |
| AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerAppDelegate.swift | ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerAppDelegate.swift |
| AiStroykaWorker/AiStroykaWorker/AppState.swift | ios/AiStroykaWorker/AiStroykaWorker/AppState.swift |
| AiStroykaWorker/AiStroykaWorker/RootView.swift | ios/AiStroykaWorker/AiStroykaWorker/RootView.swift |
| AiStroykaWorker/AiStroykaWorker/Info.plist | ios/AiStroykaWorker/AiStroykaWorker/Info.plist |
| AiStroykaWorker/AiStroykaWorker/AiStroykaWorker.entitlements | ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorker.entitlements |
| AiStroykaWorker/AiStroykaWorker/Assets.xcassets | ios/AiStroykaWorker/AiStroykaWorker/Assets.xcassets |
| AiStroykaWorker/AiStroykaWorker/Persistence/*.swift | ios/AiStroykaWorker/AiStroykaWorker/Persistence/*.swift |
| AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift |
| AiStroykaWorker/AiStroykaWorker/Services/UploadManager.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/UploadManager.swift |
| AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift |
| AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift |
| AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift |
| AiStroykaWorker/AiStroykaWorker/Services/PushRegistrationService.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/PushRegistrationService.swift |
| AiStroykaWorker/AiStroykaWorker/Services/LocalReminderService.swift | ios/AiStroykaWorker/AiStroykaWorker/Services/LocalReminderService.swift |
| AiStroykaWorker/AiStroykaWorker/Views/*.swift | ios/AiStroykaWorker/AiStroykaWorker/Views/*.swift |
| AiStroykaWorker/AiStroykaWorker/Preview Content/Preview Assets.xcassets | ios/AiStroykaWorker/AiStroykaWorker/Preview Content/Preview Assets.xcassets |

---

## Manager → ios/AiStroykaManager/AiStroykaManager/

| Old path | New path |
|----------|----------|
| AiStroykaWorker/AiStroykaManager/AiStroykaManagerApp.swift | ios/AiStroykaManager/AiStroykaManager/AiStroykaManagerApp.swift |
| AiStroykaWorker/AiStroykaManager/ManagerSessionState.swift | ios/AiStroykaManager/AiStroykaManager/ManagerSessionState.swift |
| AiStroykaWorker/AiStroykaManager/ManagerRootView.swift | ios/AiStroykaManager/AiStroykaManager/ManagerRootView.swift |
| AiStroykaWorker/AiStroykaManager/Info.plist | ios/AiStroykaManager/AiStroykaManager/Info.plist |
| AiStroykaWorker/AiStroykaManager/Assets.xcassets | ios/AiStroykaManager/AiStroykaManager/Assets.xcassets |
| AiStroykaWorker/AiStroykaManager/Services/ManagerAPI.swift | ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift |
| AiStroykaWorker/AiStroykaManager/Design/*.swift | ios/AiStroykaManager/AiStroykaManager/Design/*.swift |
| AiStroykaWorker/AiStroykaManager/Views/*.swift | ios/AiStroykaManager/AiStroykaManager/Views/*.swift |

---

## Not migrated

- WorkerLite/ folder (alternate project).
- Root Info.plist (AiStroykaWorker/Info.plist).
- Config/ — optional copy to ios/Config; document in report.
- ContentView.swift — dead code; optional.
