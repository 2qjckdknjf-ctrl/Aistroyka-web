# Entry routing policy (Step 9)

**Status:** Step 9 — post-signup / post-login entry routing polish.

## Purpose

Define a canonical policy for where users land after login, signup, or first entry. Ensures:

- New users/workspaces go into the correct onboarding flow.
- Legacy operational workspaces continue to dashboard.
- Explicit deep links (`next` param) are preserved when safe.
- No open redirects; no redirect loops.

## Policy matrix

| Condition | Target | Reason |
|-----------|--------|--------|
| Explicit safe `next` param | `next` route | `explicit_next` |
| No `next` or invalid `next` | `/{locale}/dashboard` | `default_dashboard` |
| Orchestration unavailable / inconsistent | `/{locale}/dashboard` | `fallback_dashboard` |

### New workspace / onboarding-needed

- Post-login/post-signup → `/{locale}/dashboard`.
- `OnboardingGate` (client-side) fetches orchestration and shows either `PlanFitOnboardingShell` or dashboard content.
- No separate onboarding entry route; dashboard is the canonical entry point.

### Existing operational workspace

- Same flow: redirect to dashboard.
- `OnboardingGate` receives `dashboard_ready` or `setup_ready` from orchestration → renders dashboard.
- Legacy workspaces with projects get `dashboard_ready` from orchestration (or activation/status fallback).

### Explicit deep link / `next` param

- If `next` is valid and safe → redirect to `next`.
- Safe prefixes (from `SAFE_PATH_PREFIXES` in `lib/entry/entry-routing.ts`, plus locale): `/dashboard`, `/portal`, `/projects`, `/portfolio`, `/team`, `/settings`, `/invite`, `/billing`, `/subscribe`, `/admin`, `/platform-admin`, `/owner` (and subpaths).
- Paths without locale (e.g. `/invite/accept?token=...`) are accepted and locale is prepended.
- Open redirects are blocked: protocol-relative (`//`), external URLs, non-path strings are rejected.

`forgot-password` / `reset-password` are **not** safe `next` targets. After recovery, the app sends users to `/{locale}/login?reset=success` instead of a deep link.

### Auth pages vs password recovery

Middleware `AUTH_PREFIXES`: `/login`, `/register`, `/forgot-password`.

- Logged-in users on those pages → `resolvePostAuthEntry` (`X-Auth-Redirect: post-auth-entry`).
- `/{locale}/reset-password` is **intentionally excluded**. The recovery callback establishes a session; bouncing that page to dashboard would prevent setting a new password. See `docs/auth/PASSWORD_RECOVERY.md`.

### Dual-role primary membership (PR #242)

A user can be an internal contractor in one tenant and a portal `stakeholder` in another. Primary workspace is **not** “first `tenant_members` row”.

1. Owned tenant (`tenants.user_id`) → role `owner` for that tenant.
2. Else `pickPrimaryTenantMembership()` ranks: `owner` 4 > `admin` 3 > `member` 2 > `viewer` 1 > `stakeholder` 0. Ties keep the first highest-rank row.

Used by `getTenantContextFromRequest`, `getActiveTenantRoleForUser`, billing subscription-gate tenant pick, and the API engine. Tests: `tenant-membership-priority.test.ts`, `tenant.context.test.ts`.

**Pitfall:** an unordered `limit(1)` on `tenant_members` can pick the stakeholder row first and hide the cabinet. Do not reintroduce that.

### Portal-only stakeholder path gate

After session refresh, if `isPortalOnlyTenantRole(role)` (`role === "stakeholder"` only):

- Contractor list/home (`/dashboard`, `/dashboard/projects`) → `/{locale}/portal/projects`.
- Project detail `/dashboard/projects/:id` → `/{locale}/dashboard/projects/:id/client`.
- Other `/dashboard/*` except stakeholder-invite and `/client` → portal home.
- `/billing`, `/admin`, `/portfolio`, `/projects` → portal home.
- Bare `/portal` → `/portal/projects`.

Dual-role users whose **primary** role is internal are **not** portal-only; they keep `/dashboard`.

Role-lookup exceptions in middleware **fail open** (contractor dashboards must not lock). Header on a successful stakeholder bounce: `X-Auth-Redirect: stakeholder-portal`.

### Inconsistent state

- Orchestration returns `inconsistent_state` → `OnboardingGate` shows `InconsistentStateScreen`.
- User still lands on dashboard; gate handles the UI.
- No redirect loop: dashboard entry is stable; gate does not redirect back to login.

## Implementation

- **Resolver:** `resolvePostAuthEntry({ locale, next, baseUrl })` in `lib/entry/entry-routing.ts`.
- **Sanitizer:** `sanitizeNextRoute(next, baseUrl, locale)` — same-origin check, safe path allowlist.
- **Integration:** Middleware (auth-page redirect + stakeholder path gate), login page (post-auth client redirect).
- **Primary membership:** `lib/tenant/tenant-membership-priority.ts` (`pickPrimaryTenantMembership`).
- **Active role:** `lib/tenant/tenant-role.server.ts` (`getActiveTenantRoleForUser`).
- **Portal path gate:** `lib/tenant/stakeholder-dashboard-paths.ts` (`redirectIfStakeholderBlockedPath`).

## Loop safety

- Login → dashboard: user is authenticated; no redirect back to login.
- Dashboard → OnboardingGate: gate fetches orchestration; shows shell or content; no redirect.
- Invalid `next` → fallback to dashboard; no retry of invalid `next`.
- Orchestration failure → activation/status fallback; no redirect loop.

## Legacy safety

- No forced migration of legacy tenants.
- Orchestration returns `dashboard_ready` for workspaces with projects and no plan-fit state.
- Deep links for existing users remain valid when under safe prefixes.
