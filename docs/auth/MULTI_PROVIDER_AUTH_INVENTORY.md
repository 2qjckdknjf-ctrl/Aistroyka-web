# AISTROYKA Multi-Provider Auth Inventory

Updated: 2026-08-31 (Apple/Google + optional phone OTP + password recovery + dual-role primary membership)

## Current Auth Flow

- Web login uses `POST /api/auth/login` (`/api/v1/auth/login` re-export), then sets Supabase `sb-*` session cookies via `@supabase/ssr`.
- Register page uses Supabase browser `signUp` directly and relies on Supabase confirmation/session behavior.
- Web OAuth (Apple + Google) uses `supabase.auth.signInWithOAuth` / `linkIdentity` from `AuthProviderButtons`, returning to `GET /api/auth/callback`.
- Password recovery (Phase 2 / PR #240): `/{locale}/forgot-password` and `/{locale}/reset-password` call `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`. The email `redirectTo` is `{origin}/api/auth/callback?callback=/{locale}/reset-password&recovery=1`. Runbook: `docs/auth/PASSWORD_RECOVERY.md`.
- Middleware (`apps/web/middleware.ts`) calls `updateSession()` and gates protected routes by authenticated user presence.
- API authorization is tenant-aware through `getTenantContextFromRequest()` → `tenant_members` / `tenants.user_id` checks.
- Authenticated status alone does **not** grant tenant/project access:
  - tenant context can be absent (`tenantId: null`) even with valid auth session
  - routes using `requireTenant()` return 401/403 when no membership exists.

## Providers (what the code actually does)

| Provider | Web | iOS | Notes |
|----------|-----|-----|--------|
| Email/password | Login + register | Shared `AuthService.signIn` | Must-not-break surface. |
| Apple | `signInWithOAuth({ provider: "apple" })` | Native `Sign in with Apple` → `AuthService.signInWithApple` (`POST /auth/v1/token?grant_type=id_token`) | Services ID `ai.aistroyka.web`; bundle IDs `ai.aistroyka.worker` / `ai.aistroyka.manager` stay additional Client IDs. Operator script: `apps/web/scripts/enable-auth-apple.mjs`. |
| Google | `signInWithOAuth({ provider: "google" })` | Shared PKCE + `ASWebAuthenticationSession` → `ai.aistroyka.{worker\|manager}://auth-callback` → `AuthService.exchangePKCE` | Dedicated GCP project `aistroyka-auth`. Operator script: `apps/web/scripts/enable-auth-google.mjs`. |
| Telegram | Link to `/{locale}/telegram/start` | Not a native login button | Needs `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` or `TELEGRAM_BOT_USERNAME` + `TELEGRAM_BOT_TOKEN`. |
| Phone OTP | Not on web login | Worker only; hidden unless `AISTROYKA_PHONE_OTP=1` (env or Info.plist) | Default **off**. Twilio is **not** a launch/CI/deploy gate. `enable-auth-phone-otp.mjs` defaults to `--status`; `--enable` refuses unless SMS credentials already exist in Auth config. |

`AuthProviderButtons` always renders Email + Apple + Google + Telegram on login/register. Completing Apple/Google still requires the provider to be enabled in Supabase Auth. Do not treat a visible button as live-provider proof.

Identity mirror: after a non-recovery callback, if `app_metadata.provider` is `apple` or `google`, the handler upserts `public.user_identities` (`linkIdentityRow`). Google was added to the `user_identities.provider` check in `20260831120000_user_identities_google.sql`.

Linked-method API: `GET/POST /api/v1/auth/methods`. Unlink body `{ action: "unlink", provider: "apple" \| "google" \| "telegram" }`. Apple/Google also call `supabase.auth.unlinkIdentity`. Last remaining method → `400 last_method_forbidden`.

## Session & Cookie Handling

- Browser/server session bootstrap:
  - `apps/web/lib/supabase/client.ts` (browser client)
  - `apps/web/lib/supabase/server.ts` (server client with cookie adapter)
  - `apps/web/lib/supabase/middleware.ts` (edge cookie refresh + user read)
- Login cookies are issued from `/api/auth/login` route handler and merged in middleware responses (`mergeSupabaseSessionIntoResponse`).
- Mobile uses bearer tokens (Supabase REST password grant or id_token / PKCE) stored in iOS keychain (`ios/Shared/Sources/Shared/AuthService.swift`).

## User Profile / Onboarding Model

- Primary profile layer is `public.user_onboarding_profiles`:
  - `persona`, `company_name`, `company_type`, `onboarding_completed`, `tenant_id`.
- First successful OAuth creates the Auth user — there is no separate social registration step.
- Onboarding decision flow:
  - `GET /api/v1/onboarding/status` determines onboarding visibility.
  - `POST /api/v1/onboarding/complete` may create tenant + owner membership for non-customer personas.
- Callback `ensureOnboardingProfileExists` inserts a stub profile (`persona: "other"`) when missing.

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
  - Normal sign-in: exchange `code`, optional Apple/Google identity link, ensure onboarding profile, then `next` or dashboard (`?onboarding=1` when no membership).
  - Recovery: `recovery=1` redirects to the sanitized `callback` (reset-password) and skips onboarding / identity linking.
- Auth pages: `/(auth)/login`, `/(auth)/register`, `/(auth)/forgot-password`.
- `/(auth)/reset-password` is **not** an auth-page bounce target (recovery session must stay).
- Protected route prefixes: `/dashboard`, `/portal`, `/projects`, `/billing`, `/admin`, `/portfolio`, `/subscribe`.
- Logged-in users hitting login / register / forgot-password are redirected by `resolvePostAuthEntry`.
- Portal-only `stakeholder` users are redirected off contractor paths by `redirectIfStakeholderBlockedPath` after `getActiveTenantRoleForUser`. Role-lookup errors fail **open** (must not lock contractor dashboards).

## iOS Auth Flow Inventory

- Email/password via shared `AuthService.signIn` (Manager + Worker).
- Apple: entitlement `com.apple.developer.applesignin` on both apps; native identity token, not web OAuth.
- Google: `AuthPKCE` + `AuthOAuthSession` (`ASWebAuthenticationSession`) returning to `ai.aistroyka.worker://auth-callback` / `ai.aistroyka.manager://auth-callback`.
- Worker also supports QR login.
- Phone OTP UI is hidden unless `Config.phoneOtpEnabled` (`AISTROYKA_PHONE_OTP`).
- Tokens are persisted in keychain and reused in API clients.
- Role gating is enforced after auth in manager app (`ManagerSessionState.fetchRoleCheckResult`).

`apps/web/scripts/set-supabase-auth-urls.mjs` **merges** Redirect URLs. Do not overwrite the allow-list or the iOS custom schemes disappear.

## Existing Auth Tests

- E2E auth setup uses `/api/auth/login` and persisted Playwright storage state.
- Recovery UI smoke: `apps/web/tests/e2e/auth-recovery-smoke.spec.ts`.
- Unit tests: `multi-provider.test.ts`, `password-recovery.test.ts`, callback / methods / forgot-password routes, iOS `AuthPKCETests` + `ConfigPhoneOtpTests`.
- Telegram integration tests exist for notifications webhook/linking (not only the login bridge).

## Must-Not-Break Surfaces

1. `POST /api/auth/login` (email/password cookie login).
2. Edge middleware session refresh and protected-route gating.
3. Tenant context derivation (`tenant_members` + `tenants.user_id` + primary-membership rank).
4. Dual-role contractors keeping `/dashboard` when they also have a `stakeholder` row.
5. Password recovery (`forgot-password` / callback `recovery=1` / `reset-password`) without adding `/reset-password` to `AUTH_PREFIXES`.
6. Apple native `id_token` exchange and iOS Google PKCE callback schemes.
7. API route `requireTenant()` protections.
8. Onboarding gating when user has no tenant membership.
9. Mobile bearer token flow and manager role checks.
10. Existing Telegram notifications linking/webhook paths under `/api/v1/integrations/telegram/*`.
11. Phone OTP remaining optional/off — do not add `TWILIO_*` as a CI/deploy/launch gate.
