# Shared Layer Report — Phase 2

**Date:** 2026-03-12

---

## 1. Location

`ios/Shared/` — Swift package. Both AiStroykaManager and AiStroykaWorker add it as a local package dependency (`../Shared`).

---

## 2. Modules migrated into Shared

| File | Purpose |
|------|---------|
| APIError.swift | Public APIError type and `from(data:response:)`; isUnauthorized, isForbidden, isConflict, isRateLimited |
| Config.swift | Public baseURL, supabaseURL, supabaseAnonKey, apiBaseURL (from Bundle/environment) |
| DeviceContext.swift | Public deviceId (Keychain), newIdempotencyKey() |
| KeychainHelper.swift | Public keys (deviceIdKey, sessionTokenKey, sessionUserIdKey, pushTokenKey — legacy com.workerlite.* preserved); get/set/delete, getDeviceId/setDeviceId |
| NetworkMonitor.swift | Public NetworkMonitor (ObservableObject), isConnected, onBecameReachable; uses Combine |
| APIClient.swift | Public actor APIClient; setTokenProvider, setClientProfile, request, requestVoid, requestDataAndResponse; private EmptyJSON, AnyEncodable |
| Endpoints.swift | Public DTOs: ConfigResponse, ProjectDTO, ProjectsResponse, TaskDTO, TasksTodayResponse, RegisterDeviceResponse, ReportCreateResponse, UploadSessionResponse, SyncConflictBody, SyncConflictError, SyncBootstrapResponse, SyncChangesResponse, SyncChangeItem |
| AuthService.swift | Public actor AuthService; currentSession, signIn, signOut, getAccessToken; AuthUser |

---

## 3. Package.swift

Unchanged from phase 1: single target `Shared`, path `Sources/Shared`, iOS 16+. All `.swift` files in that directory are compiled.

---

## 4. Legacy identifiers preserved

- KeychainHelper keys: `com.workerlite.deviceId`, `com.workerlite.sessionToken`, `com.workerlite.sessionUserId`, `com.workerlite.pushToken` — preserved for migration continuity (documented in LEGACY_POST_MIGRATION).
- NetworkMonitor queue label changed from `com.workerlite.network` to `com.aistroyka.network` (no backward requirement).

---

## 5. Consumption

- **Worker app:** `import Shared` in all Swift files that use Config, APIClient, AuthService, DTOs, etc.
- **Manager app:** Same. Both apps set token provider and client profile at bootstrap (Worker: ios_lite; Manager: ios_manager).

---

## 6. Result

Shared layer is built; no shared logic duplicated in either app. Both apps depend on the Shared package via Xcode project package reference.
