# iOS Architecture Stabilization Report (Phase 1)

**Project:** AISTROYKA  
**Date:** 2026-05-13  
**Depends on:** `docs/mobile-ios/IOS_CURRENT_STATE_AUDIT.md`  

## 1. Goals (mission Phase 1)

- Centralize app/runtime and API client bootstrap for Worker and Manager.  
- Ensure **`x-client`** matches backend `ClientProfile` and middleware **lite allow-list** for field workers.  
- Keep **`x-device-id`**, **idempotency** on writes (unchanged contracts).  
- Extend shared **error** surface for UI; add small **loading / error / retry** components.  
- **401** handling: Worker and Manager clear session via same notification contract where appropriate.  
- **Log redaction** helper for future diagnostics (no new raw token logging added).  
- **Auth:** Bearer via existing `AuthService` + Keychain; logout still clears keys.  

**Non-goals:** Backend or API contract changes; Android; broad UI redesign.

---

## 2. Backend alignment: Worker `x-client`

`apps/web/lib/tenant/tenant.types.ts` defines `ios_lite` and `ios_manager`. Middleware `checkLiteAllowList` only allows **`ios_lite`** (and `android_lite`) for field-worker API paths.

**Conclusion:** AiStroyka Worker must send **`x-client: ios_lite`**, not a new `ios_worker` string (unknown values parse as `web` and can break lite routing).  

This phase encodes that in `MobileClientProfile.liteWorker` and **`AppRuntime.configureSharedNetworkingForWorker()`**.

---

## 3. What was implemented

### 3.1 Shared module (`ios/Shared/Sources/Shared/`)

| File | Purpose |
|------|---------|
| `MobileClientProfile.swift` | Typed `ios_lite` / `ios_manager` sent as `x-client`. |
| `AppRuntime.swift` | `configureSharedNetworkingForWorker()` / `configureSharedNetworkingForManager()`; help API constants (`helpHintsLaunchRoleForWorkerApp` = `"manager"` per server `LaunchRole`; `helpAssistantEventRoleWorker` = `"worker"` for events only). |
| `SafeLog.swift` | `SafeLog.redactSecrets(_:)` for Bearer / JWT-shaped / apikey substrings before logging. |
| `InlineStatusViews.swift` | `InlineLoadingRow`, `InlineErrorRetryRow` (SwiftUI, accessibility-friendly). |
| `APIClient.swift` | Default `x-client` = `MobileClientProfile.liteWorker`; **401** posts `apiClientDidReceiveUnauthorized` for **`ios_lite` and `ios_manager`** (async-safe `await` + `MainActor`). |
| `APIError.swift` | `userFacingMessage`, `isRetryable` for generic UI. |

### 3.2 AiStroyka Worker

- `RootView.swift`: `AppRuntime.configureSharedNetworkingForWorker()` on appear; `onReceive` unauthorized → `appState.logout()` when `clientProfile == ios_lite`.  
- `HomeContainerView.swift`: uses `InlineLoadingRow` / `InlineErrorRetryRow`; empty projects uses `worker_no_projects` localized string.  
- `HomeView.swift`: help hints/assistant use `AppRuntime.helpHintsLaunchRoleForWorkerApp`; assistant event uses `AppRuntime.helpAssistantEventRoleWorker`.  
- **Localization:** `worker_loading_projects`, `worker_retry` in `en` / `ru` / `es` / `it` `Localizable.strings`.

### 3.3 AiStroyka Manager

- `ManagerRootView.swift`: `AppRuntime.configureSharedNetworkingForManager()` replaces inline string.  
- `ManagerSessionState.swift`: unauthorized observer compares `MobileClientProfile.manager.rawValue` instead of magic string.

---

## 4. Auth / token / logout

- **Unchanged:** `AuthService` Supabase password grant; `KeychainHelper` storage; `signOut` deletes session keys.  
- **401:** Both apps can receive `apiClientDidReceiveUnauthorized` when profile is Worker or Manager; each app filters by profile so cross-app noise is avoided.  
- **403:** Still surfaced as `APIError` per call site; no global forced logout (role / allow-list denial may be intentional).

---

## 5. Idempotency and headers (verification)

- **Writes:** Existing `WorkerAPI` / `ManagerAPI` idempotency keys unchanged.  
- **Headers:** All `APIClient.request` / `requestDataAndResponse` calls still set `x-device-id` and `x-client`; Bearer when token provider returns a value.

---

## 6. Validation

| Check | Result |
|--------|--------|
| `xcodebuild` AiStroykaWorker Debug, iPhone 15 / iOS 17.2 simulator | **PASS** (`** BUILD SUCCEEDED **` in `artifacts/mobile-ios/worker-build.log`) |
| `xcodebuild` AiStroykaManager Debug, same destination | **PASS** (`artifacts/mobile-ios/manager-build.log`) |
| XCTest UI | **Not in repo** (Phase 9) |
| Full manual E2E + simctl launch | **Partial** — `simctl install/launch` did not complete reliably in automation on this host; recommend Xcode Run or local simctl for smoke |
| Real iPhone | **Not run** |

---

## 7. Remaining gaps (carry forward)

### P0 (not Phase 1 scope but still product blockers from audit)

- Manager evidence gallery; Reject + required notes; Worker resubmit UX; Worker report notes; etc.

### P1 (architecture follow-ups)

- Optional: migrate more Worker strings to `Localizable.strings` (RU-first).  
- Consider thin `@MainActor` session facade if `AppState` / `ManagerSessionState` duplication grows.  
- Apply `SafeLog` in any future `print`/`os_log` of request metadata.  
- **`reportReview`** idempotency: Manager `PATCH` does not pass `x-idempotency-key` today — evaluate in a later phase if duplicates are observed.

---

## 8. Phase 1 closure block

### A. PHASE STATUS

**CLOSED**

### B. WHAT WAS IMPLEMENTED

- Typed mobile client profiles + centralized `AppRuntime` bootstrap.  
- Worker explicit `ios_lite` bootstrap + 401 → logout.  
- Manager bootstrap uses shared enum.  
- Shared inline loading/error/retry UI; `APIError` UX helpers; `SafeLog`.  
- Help API role constants aligned with server `LaunchRole` + honest worker analytics on assistant events.

### C. VALIDATION

- **Build:** Worker + Manager Debug simulator — **PASS**  
- **Tests:** None added  
- **Simulator:** Manual launch via automation **not proven**; builds only  
- **Real device:** Not run  
- **Backend evidence:** Not run (no contract change)

### D. REMAINING GAPS

- P0 product flows from audit; P1 items in §7.

### E. FILES CHANGED (high level)

- `ios/Shared/Sources/Shared/*.swift` (new + `APIClient`, `APIError`)  
- `ios/AiStroykaWorker/.../RootView.swift`, `HomeContainerView.swift`, `HomeView.swift`, `*.lproj/Localizable.strings`  
- `ios/AiStroykaManager/.../ManagerRootView.swift`, `ManagerSessionState.swift`  
- `artifacts/mobile-ios/*-build.log`

### F. REPORTS CREATED

- `docs/mobile-ios/IOS_ARCHITECTURE_STABILIZATION_REPORT.md` (this file)

### G. NEXT PHASE ALLOWED

**YES** — Phase 2 (onboarding / first-run clarity), assuming Phase 1 acceptance.

---

*End of Phase 1 report.*
