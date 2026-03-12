# Worker Lite pilot decision

**Decision:** **SAFE TO EXCLUDE FROM PILOT**

Worker Lite (iOS app in `ios/WorkerLite/`) is in the middle of a rename and structural change. Git shows many **deleted** files (WorkerLiteApp, ContentView, AppState, RootView, Core/*, Networking/*, multiple Views, etc.) while the Xcode project still references them. The **product** and test targets are already named AiStroykaWorker (AiStroykaWorker.app, AiStroykaWorkerTests, AiStroykaWorkerUITests), but the project folder is still WorkerLite and several file references point to missing files. Building as-is is likely to **fail** until dead references are removed and any missing sources are restored or replaced.

---

## Binary decision

| Option | Verdict |
|--------|--------|
| **SAFE TO EXCLUDE FROM PILOT** | ✅ **Use this.** Pilot with web + Manager iOS only. Include Worker Lite in a later pilot after stabilization. |
| **SAFE TO INCLUDE AFTER MANUAL XCODE STEPS** | Possible only after completing the Xcode checklist below and verifying build + device smoke. |
| **NOT SAFE FOR PILOT** | Treat as equivalent to EXCLUDE: do not include Worker Lite in pilot until the checklist is done and signed off. |

---

## If you need Worker Lite in pilot later: Xcode checklist

Do **not** rely on automated project-file edits. Do the following manually in Xcode.

### 1. Target and product

- **Target name:** Should be single app target (e.g. **AiStroykaWorker**). Confirm in Project → Targets.
- **Product name / bundle:** Set **Display Name** and **Bundle Identifier** (e.g. `ai.aistroyka.worker` or your convention). Ensure **PRODUCT_BUNDLE_IDENTIFIER** is correct for signing.

### 2. Schemes

- **Scheme:** One scheme for the app (e.g. AiStroykaWorker). Set Run → Build Configuration to Release for archive. Ensure the scheme builds the app target, not a test target.

### 3. Entitlements and signing

- **Entitlements file:** AiStroykaWorker.entitlements (or equivalent). Attach to the app target. Enable push if needed.
- **Signing:** Team and provisioning profile for the bundle ID. No code changes in repo for signing.

### 4. Dead file references

- In Project Navigator, find **red** (missing) files. These are the ones git shows as deleted (e.g. WorkerLiteApp.swift, ContentView.swift, AppState.swift, RootView.swift, APIError.swift, Config.swift, DeviceContext.swift, KeychainHelper.swift, NetworkMonitor.swift, APIClient.swift, Endpoints.swift, AuthService.swift, UploadManager.swift, WorkerAPI.swift, LoginView.swift, HomeContainerView.swift, ProjectPickerView.swift, ReportCreateView.swift, ImagePicker.swift, CameraPicker.swift, TaskDetailView.swift, PushRegistrationService.swift, LocalReminderService.swift, SyncService.swift, Operation.swift, OperationQueueStore.swift, OperationQueueExecutor.swift, WorkerLite.entitlements, etc.).
- **Remove** each red reference from the target (Select → Delete → "Remove Reference" only). Do **not** delete from disk if the file still exists elsewhere.
- If the app **requires** any of these files to compile, you must restore them from git history or re-add replacement files and fix references. Current state suggests replacements may already exist (e.g. AiStroykaWorkerApp.swift, AiStroykaWorkerAppDelegate.swift, HomeView.swift, LoginView.swift, etc. are modified, not deleted). So: remove references to **deleted** files; keep references to **existing** files (AppStateStore, BackgroundUploadService, HomeView, LoginView, etc. that are still present).

### 5. Info.plist and app icon

- **Info.plist:** Present at WorkerLite/WorkerLite/Info.plist. Ensure it is set as the target’s Info.plist. Check bundle display name and required keys.
- **App icon:** Ensure Assets.xcassets or AppIcon is present and referenced. If Assets were deleted, add a minimal asset catalog and app icon.

### 6. Build and device smoke

- **Build:** Product → Build (Cmd+B). Fix any compile errors (missing types, missing files).
- **Run on device:** Select device/simulator → Run. Login, sync, and one task/report flow.
- **Archive:** Product → Archive. Validate for App Store or ad hoc if needed.

---

## Summary

- **Pilot launch:** Exclude Worker Lite. Use **web** and **Manager iOS** only.
- **Later:** To include Worker Lite, assign an owner to complete the Xcode checklist above, verify build and device smoke, then add to pilot scope.
