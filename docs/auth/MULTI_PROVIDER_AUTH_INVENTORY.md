# AISTROYKA Multi-Provider Auth Inventory

Updated: 2026-08-24 (password recovery + dual-role primary membership)

## Current Auth Flow (Before Multi-Provider Extension)

- Web login uses `POST /api/auth/login` (`/api/v1/auth/login` re-export), then sets Supabase `sb-*` session cookies via `@supabase/ssr`.
- Register page uses Supabase browser `signUp` directly and relies on Supabase confirmation/session behavior.
- Password recovery (Phase 2 / PR #240): `/{locale}/forgot-password` and `/{locale}/reset-password` call `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`. The email `redirectTo` is `{origin}/api/auth/callback?callback=/{locale}/reset-password&recovery=1`. Runbook: `docs/auth/PASSWORD_RECOVERY.md`.
- Middleware (`apps/web/middleware.ts`) calls `updateSession()` and gates protected routes by authenticated user presence.
- API authorization is tenant-aware through `getTenantContextFromRequest()` -> `tenant_members` / `tenants.user_id` checks.
- Authenticated status alone does **not** grant tenant/project access:
  - tenant context can be absent (`tenantId: null`) even with valid auth session
  - routes using `requireTenant()` return 401/403 when no membership exists.

## Session & Cookie Handling

- Browser/server session bootstrap:
  - `apps/web/lib/supabase/client.ts` (browser client)
  - `apps/web/lib/supabase/server.ts` (server client with cookie adapter)
  - `apps/web/lib/supabase/middleware.ts` (edge cookie refresh + user read)
- Login cookies are issued from `/api/auth/login` route handler and merged in middleware responses (`mergeSupabaseSessionIntoResponse`).
- Mobile uses bearer tokens (Supabase REST password grant) stored in iOS keychain (`ios/Shared/Sources/Shared/AuthService.swift`).

## User Profile / Onboarding Model

- Primary profile layer is `public.user_onboarding_profiles`:
  - `persona`, `company_name`, `company_type`, `onboarding_completed`, `tenant_id`.
- Onboarding decision flow:
  - `GET /api/v1/onboarding/status` determines onboarding visibility.
  - `POST /api/v1/onboarding/complete` may create tenant + owner membership for non-customer personas.

## Tenant / Project Access Logic

- Tenant membership resolution:
  - Owned tenant (`tenants.user_id`) wins as `owner`.
  - Otherwise `pickPrimaryTenantMembership()` in `tenant-membership-priority.ts` ranks `tenant_members` rows: `owner` > `admin` > `member` > `viewer` > `stakeholder`. Equal rank keeps the first matching row.
  - Internal roles always beat portal-only `stakeholder`, so a contractor who is also a client stakeholder keeps cabinet (`/dashboard`) instead of being gated to `/portal/projects`.
- Same helper is used by `getTenantContextFromRequest`, `getActiveTenantRoleForUser` (middleware / dashboard layout), billing subscription gate, and the API engine.
- `requireTenant()` enforces membership for protected API routes.
- Role and permission checks are layered on top (`authz.service`, `authorize(...)`).
- Mobile `/api/v1/*` bearer flow still resolves through same tenant context rules (no bypass).
- Post-auth landing + stakeholder path gate: `docs/architecture/ENTRY_ROUTING_POLICY.md`.

## Middleware and Callback Surfaces

- OAuth / recovery callback: `GET /api/auth/callback` (`apps/web/app/api/auth/callback/route.ts`).
  - Normal sign-in: exchange `code`, optional Apple identity link, ensure onboarding profile, then `next` or dashboard.
  - Recovery: `recovery=1` redirects to the sanitized `callback` (reset-password) and skips onboarding / identity linking.
- Auth pages: `/(auth)/login`, `/(auth)/register`, `/(auth)/forgot-password`.
- `/(auth)/reset-password` is **not** an auth-page bounce target (recovery session must stay).
- Protected route prefixes: `/dashboard`, `/portal`, `/projects`, `/billing`, `/admin`, `/portfolio`, `/subscribe`.
- Logged-in users hitting login / register / forgot-password are redirected by `resolvePostAuthEntry`.
- Portal-only `stakeholder` users are redirected off contractor paths by `redirectIfStakeholderBlockedPath` after `getActiveTenantRoleForUser`. Role-lookup errors fail **open** (must not lock contractor dashboards).

## iOS Auth Flow Inventory

- Manager and Worker apps both use email/password via shared `AuthService.signIn`.
- Tokens are persisted in keychain and reused in API clients.
- Role gating is enforced after auth in manager app (`ManagerSessionState.fetchRoleCheckResult`).
- No native Apple auth button existed before this extension.

## Existing Auth Tests

- E2E auth setup uses `/api/auth/login` and persisted Playwright storage state.
- Unit tests cover tenant guard/authz behavior and route-level auth for selected APIs.
- Telegram integration tests existed only for notifications webhook/linking (not login bridge).

## Must-Not-Break Surfaces

1. `POST /api/auth/login` (email/password cookie login).
2. Edge middleware session refresh and protected-route gating.
3. Tenant context derivation (`tenant_members` + `tenants.user_id` + primary-membership rank).
4. Dual-role contractors keeping `/dashboard` when they also have a `stakeholder` row.
5. Password recovery (`forgot-password` / callback `recovery=1` / `reset-password`) without adding `/reset-password` to `AUTH_PREFIXES`.
6. API route `requireTenant()` protections.
7. Onboarding gating when user has no tenant membership.
8. Mobile bearer token flow and manager role checks.
9. Existing Telegram notifications linking/webhook paths under `/api/v1/integrations/telegram/*`.
