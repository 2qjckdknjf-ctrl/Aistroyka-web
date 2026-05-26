# AISTROYKA Multi-Provider Auth Inventory

Updated: 2026-05-26

## Current Auth Flow (Before Multi-Provider Extension)

- Web login uses `POST /api/auth/login` (`/api/v1/auth/login` re-export), then sets Supabase `sb-*` session cookies via `@supabase/ssr`.
- Register page uses Supabase browser `signUp` directly and relies on Supabase confirmation/session behavior.
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
  - `tenant.context.ts` checks owned tenant (`tenants.user_id`) or `tenant_members`.
- `requireTenant()` enforces membership for protected API routes.
- Role and permission checks are layered on top (`authz.service`, `authorize(...)`).
- Mobile `/api/v1/*` bearer flow still resolves through same tenant context rules (no bypass).

## Middleware and Callback Surfaces

- No OAuth callback route existed for provider exchange at inventory time.
- Auth pages: `/(auth)/login`, `/(auth)/register`.
- Protected route prefixes: `/dashboard`, `/projects`, `/admin`, etc.
- Logged-in users are redirected away from auth pages by `resolvePostAuthEntry`.

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
3. Tenant context derivation (`tenant_members` + `tenants.user_id`).
4. API route `requireTenant()` protections.
5. Onboarding gating when user has no tenant membership.
6. Mobile bearer token flow and manager role checks.
7. Existing Telegram notifications linking/webhook paths under `/api/v1/integrations/telegram/*`.
