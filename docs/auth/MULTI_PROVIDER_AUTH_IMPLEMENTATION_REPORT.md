# Multi-Provider Auth Implementation Report

Date: 2026-05-26

## What Was Changed

### 1) Auth inventory and docs

- Added `docs/auth/MULTI_PROVIDER_AUTH_INVENTORY.md`.
- Added setup runbooks:
  - `docs/auth/APPLE_AUTH_SETUP.md`
  - `docs/auth/TELEGRAM_AUTH_SETUP.md`

### 2) Data model

- Added migration: `apps/web/supabase/migrations/20260526090000_user_identities.sql`
  - `public.user_identities`
  - providers restricted to `apple` / `telegram`
  - `unique(provider, provider_user_id)`
  - RLS enabled with own-row read/write policies
  - `updated_at` trigger

### 3) Apple auth (web + iOS)

- Web:
  - Added Apple provider button on login/register via `AuthProviderButtons`.
  - Added canonical callback: `GET /api/auth/callback`.
  - Callback now:
    - exchanges OAuth code to session
    - mirrors Apple identity into `user_identities`
    - ensures onboarding profile exists
    - routes by membership (`/dashboard` vs `/dashboard?onboarding=1`)
- iOS:
  - Shared auth added: `AuthService.signInWithApple(...)`.
  - Native Sign in with Apple buttons added to:
    - `ios/AiStroykaManager/.../ManagerLoginView.swift`
    - `ios/AiStroykaWorker/.../Views/LoginView.swift`
  - First-available Apple full name is forwarded into auth metadata update.

### 4) Telegram Login bridge

- Added endpoint: `POST /api/v1/auth/telegram`.
- Added secure helper: `apps/web/lib/auth/telegram-auth.ts`.
- Endpoint behavior:
  - validates payload fields
  - validates auth freshness (`auth_date`)
  - verifies Telegram HMAC hash with timing-safe compare
  - rejects stale/invalid payloads
  - links identity to existing user or creates/reuses Telegram pseudo-user
  - issues app session through existing Supabase session flow
  - does not create tenant membership
  - returns membership-aware next route
- Added Telegram auth UI flow:
  - `/[locale]/telegram/start` (widget start)
  - `/[locale]/telegram` (callback finalize -> `/api/v1/auth/telegram`)

### 5) Account linking surface

- Added API: `GET/POST /api/v1/auth/methods`
  - returns linked methods (email/apple/telegram)
  - unlink with rule: cannot unlink last remaining method
- Added dashboard settings page:
  - `/[locale]/dashboard/settings/auth`
  - `AuthMethodsSettingsCard` with linked methods + link/unlink actions.

### 6) UI localization and nav

- Login/register updated with:
  - Continue with Email
  - Continue with Apple
  - Continue with Telegram
- Added auth settings nav entry.
- Added new auth copy keys in `en/ru/es/it`.

## Security Model Summary

- Authentication provider != authorization:
  - tenant/project access still resolved via `tenant_members` and tenant ownership.
- Telegram payload must pass freshness + signed hash verification.
- Secrets stay server-side (`TELEGRAM_BOT_TOKEN`, Apple private key, service role).
- No middleware weakening; protected routes still require session and tenant context where needed.

## Tenant Access Behavior

- After Apple/Telegram login:
  - if tenant membership exists -> dashboard
  - if no membership -> dashboard onboarding route (`?onboarding=1`)
- No automatic tenant membership is created by provider login.

## Env Variables / Config

- Added/used:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_BOT_USERNAME` or `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
  - optional `TELEGRAM_AUTH_ENABLED=true` for stricter release validation
- Updated release validation in `apps/web/lib/config/release-env.ts`.
- Updated environment doc: `docs/ENVIRONMENT-VARIABLES.md`.

## Tests and Validation

Executed:

- `bun run lint` ✅
- `bun run test` ✅
- `bun run build` ✅
- `bun run cf:build` ✅
- `bun run i18n:check` ✅
- `xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build` ✅
- `xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build` ✅

Added tests:

- `app/api/auth/callback/route.test.ts`
- `app/api/v1/auth/telegram/route.test.ts`
- `app/api/v1/auth/methods/route.test.ts`

## Remaining External Operator Steps

1. Configure Apple provider in Supabase with production/staging redirect URLs.
2. Configure Apple capabilities in iOS app IDs / bundle IDs.
3. Set Telegram bot domain(s) via BotFather `/setdomain`.
4. Set production secrets in Cloudflare/GitHub environments.
5. Run iOS target build + UITest smoke with Apple sign-in enabled credentials/capability.

## Final Verdict

**NOT CLOSED**

### Exact blockers

1. Apple provider and Telegram domain/secrets require external operator configuration (not in-repo).
