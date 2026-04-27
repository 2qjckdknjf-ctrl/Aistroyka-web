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
- Safe routes: `/{locale}/dashboard`, `/{locale}/projects`, `/{locale}/portfolio`, `/{locale}/team`, `/{locale}/settings`, `/{locale}/invite`, `/{locale}/billing`, `/{locale}/admin` (and subpaths).
- Paths without locale (e.g. `/invite/accept?token=...`) are accepted and locale is prepended.
- Open redirects are blocked: protocol-relative (`//`), external URLs, non-path strings are rejected.

### Inconsistent state

- Orchestration returns `inconsistent_state` → `OnboardingGate` shows `InconsistentStateScreen`.
- User still lands on dashboard; gate handles the UI.
- No redirect loop: dashboard entry is stable; gate does not redirect back to login.

## Implementation

- **Resolver:** `resolvePostAuthEntry({ locale, next, baseUrl })` in `lib/entry/entry-routing.ts`.
- **Sanitizer:** `sanitizeNextRoute(next, baseUrl, locale)` — same-origin check, safe path allowlist.
- **Integration:** Middleware (auth-page redirect), login page (post-auth client redirect).

## Loop safety

- Login → dashboard: user is authenticated; no redirect back to login.
- Dashboard → OnboardingGate: gate fetches orchestration; shows shell or content; no redirect.
- Invalid `next` → fallback to dashboard; no retry of invalid `next`.
- Orchestration failure → activation/status fallback; no redirect loop.

## Legacy safety

- No forced migration of legacy tenants.
- Orchestration returns `dashboard_ready` for workspaces with projects and no plan-fit state.
- Deep links for existing users remain valid when under safe prefixes.
