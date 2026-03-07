# Role Gating (Phase 2)

**Date:** 2026-03-07

---

## Backend

- **GET /api/v1/me** added. Returns `{ data: { tenant_id, user_id, role } }` from current request tenant context. No auth required in the sense that unauthenticated requests get `user_id: null`; authenticated users without a tenant get `tenant_id: null, role: null`.
- Role comes from `getTenantContextFromRequest`: tenant owner → `"owner"`; else from `tenant_members.role` (`owner` | `admin` | `member` | `viewer`).

## Manager app

- **ManagerSessionState.checkRole()** calls `ManagerAPI.me()`.
- **Allowed roles:** `owner`, `admin`, `member` (foreman/team lead mapped to member in DB).
- **Not allowed:** `viewer`, or missing tenant/role.
- **Messages:** "No tenant context." when data is nil; "You are not a member of any team." when role is empty; otherwise a clear message that Manager is for owners/admins/team leads and the user’s role doesn’t have access.
- **401:** Treated as session expired; user sees "Session expired. Please sign in again." and can sign out/retry.
- **ManagerUnauthorizedView** continues to show the message and a Sign out button.

## Flow

1. User signs in → `checkSession()` runs → `checkRole()` runs.
2. `checkRole()` calls GET /api/v1/me (with Manager’s token and `x-client: ios_manager`).
3. If role ∈ { owner, admin, member } → `isAuthorizedRole = true` → tab shell.
4. Otherwise → `isAuthorizedRole = false`, `roleFailureMessage` set → ManagerUnauthorizedView.
5. Sign out clears state and returns to login.

## Backend gap closed

- Before: no endpoint exposed role to the client.
- After: GET /api/v1/me provides tenant_id, user_id, role for role gating and future use.
