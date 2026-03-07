# Manager App Bootstrap

**Date:** 2026-03-07

---

## Entry point

- **AiStroykaManagerApp.swift:** `@main` struct, creates `ManagerSessionState` as `@StateObject`, presents `ManagerRootView` with `.environmentObject(sessionState)`.

## Session and auth

- **ManagerSessionState:** `@MainActor ObservableObject`. Tracks `isLoggedIn`, `isAuthorizedRole`, `roleFailureMessage`.
  - `checkSession()`: Calls `AuthService.shared.currentSession()`; if present, sets `isLoggedIn = true` and runs `checkRole()`.
  - `checkRole()`: Currently allows any logged-in user (`isAuthorizedRole = true`). TODO: when backend exposes role (e.g. GET /api/v1/me or tenant context), restrict to manager/owner/admin/foreman and set `roleFailureMessage` otherwise.
  - `signOut()`: Calls `AuthService.shared.signOut()`, clears state.

## Backend / API environment

- **ManagerRootView.onAppear:** `APIClient.shared.setTokenProvider { await AuthService.shared.getAccessToken() }` so all API calls use the same Supabase session token.
- **Config:** Same as Worker: `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` from Info.plist (from Secrets.xcconfig). `Config.apiBaseURL` → `{BASE_URL}/api/v1`.

## Role-aware gating

- **ManagerRootView** body:
  - If `!sessionState.isLoggedIn` → `ManagerLoginView()`.
  - Else if `!sessionState.isAuthorizedRole` and `roleFailureMessage != nil` → `ManagerUnauthorizedView(message:)` with Sign out.
  - Else → `ManagerTabShell()` (main tab UI).

Unauthorized role: clear message and single “Sign out” action; no access to tabs.

## Shared engine connection

- Auth: shared `AuthService` (Supabase REST, Keychain).
- API: shared `APIClient` (token provider, x-device-id, x-client). Manager screens will use shared DTOs from `Endpoints.swift` and a Manager-specific API layer (ManagerAPI) for tasks, reports, projects, workers, ops.
