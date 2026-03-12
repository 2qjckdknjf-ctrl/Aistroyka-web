# Shared Layer Validation — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Shared package layout

```
ios/Shared/
  Package.swift
  Sources/Shared/
    APIError.swift
    APIClient.swift
    AuthService.swift
    Config.swift
    DeviceContext.swift
    Endpoints.swift
    KeychainHelper.swift
    NetworkMonitor.swift
    (and any other shared types)
```

- Single Swift package; consumed by both apps as **local package dependency** (`../Shared`).
- Both projects resolve it; no duplicate package definitions.

---

## 2. Usage by app

### AiStroykaWorker

- **Import Shared:** Used in App, RootView, AppState, WorkerAPI, SyncService, UploadManager, OperationQueueStore, AppStateStore, PushRegistrationService, LocalReminderService, BackgroundUploadService, OperationQueueExecutor, and Views (LoginView, HomeView, HomeContainerView, ReportCreateView, TaskDetailView, ProjectPickerView, DiagnosticsView, ImagePicker, CameraPicker).
- **Consumed:** APIClient, AuthService, Config, Endpoints, KeychainHelper, DeviceContext, APIError, network/session types.

### AiStroykaManager

- **Import Shared:** Used in App, ManagerRootView, ManagerSessionState, ManagerAPI, and Design/Views (all major views and placeholders).
- **Consumed:** APIClient, AuthService, Config, Endpoints, and shared types for API/errors.

---

## 3. Verification results

| Check | Status |
|------|--------|
| Duplicate copies in app folders | **None.** Shared code lives only in `ios/Shared/Sources/Shared/`. |
| Wrong imports | **None.** All app files use `import Shared` and reference Shared types correctly. |
| Stale legacy references | **None** in import or module name. Internal identifiers (e.g. keychain keys, queue labels) still use `workerlite` in a few places; see NAMING_AND_LEGACY_CLEANUP.md. |
| Cross-app leakage | **None.** No Manager-only code in Worker or vice versa; Shared is the only cross-app layer. |

---

## 4. Key shared components

| Component | Purpose | Used by |
|-----------|---------|---------|
| Config | baseURL, supabaseURL, supabaseAnonKey, apiBaseURL | Both apps |
| AuthService | Session, sign-in, token handling | Both apps |
| APIClient | HTTP client for API | Both apps |
| Endpoints | API paths, DTOs, errors (e.g. SyncConflictError) | Both apps |
| KeychainHelper | Secure storage (device id, session token, etc.) | Both apps |
| DeviceContext | Device info for API | Worker (and Manager if used) |
| NetworkMonitor | Connectivity | Both apps if used |

---

## 5. Conclusion

- **Shared package** is correctly used by both apps; no duplicate shared code in app targets.
- **Imports** are correct; **no cross-app leakage**; only internal identifiers retain legacy naming where documented.
- Shared layer is **validated** for launch readiness.
