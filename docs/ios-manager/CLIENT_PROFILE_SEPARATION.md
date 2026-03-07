# Client Profile Separation (Phase 2)

**Date:** 2026-03-07

---

## Goal

- **Worker app:** continues to send `x-client: ios_lite` (default).
- **Manager app:** sends `x-client: ios_manager`.
- Single APIClient; no duplication; set at app bootstrap.

## Implementation

### Backend

- **tenant.types.ts:** `ClientProfile` extended with `"ios_manager"`.
- **tenant.context.ts:** `CLIENT_VALUES` includes `"ios_manager"` so the header is accepted and stored in context.

### iOS APIClient (shared)

- **New:** `private var clientProfile: String = "ios_lite"`.
- **New:** `func setClientProfile(_ profile: String)` to set the value.
- **Changed:** All request paths use `request.setValue(clientProfile, forHTTPHeaderField: "x-client")` instead of hardcoded `"ios_lite"`.

### Manager bootstrap

- **ManagerRootView.onAppear:** In the same `Task` that sets the token provider, calls `await APIClient.shared.setClientProfile("ios_manager")` before `sessionState.checkSession()`, so every Manager-originated request sends `x-client: ios_manager`.

### Worker

- Worker never calls `setClientProfile`, so it keeps the default `"ios_lite"`.

## Result

- Manager requests are distinguishable from Worker requests via `x-client`.
- Backend can apply manager-specific logic or analytics by checking `ctx.clientProfile === "ios_manager"`.
