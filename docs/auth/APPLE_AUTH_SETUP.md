# Apple Auth Setup (AISTROYKA)

## Scope

This setup enables Apple sign-in for:

- Web (Supabase OAuth provider `apple`)
- iOS (native Sign in with Apple -> Supabase `id_token` exchange)

Email/password auth remains enabled and unchanged.

## Required Apple Developer Configuration

1. **App ID / Bundle ID**
   - Configure app capability: `Sign in with Apple`.
   - Bundle IDs must match iOS targets.
2. **Services ID**
   - Used as OAuth client identifier for web flows.
3. **Team ID**
   - Apple Developer Team identifier.
4. **Key ID + Private Key (`.p8`)**
   - Create Sign in with Apple key and store private key outside repo.
5. **Redirect URLs**
   - Add Supabase callback URL for provider exchange.
   - Add app callback URL used by AISTROYKA:
     - `https://<app-domain>/api/auth/callback`
6. **Domains / Return URLs**
   - Include production and staging domains used by AISTROYKA.

## Supabase Provider Configuration

In Supabase Auth -> Providers -> Apple:

- Enable provider.
- Set `Client ID` (Services ID).
- Set Team ID, Key ID, private key.
- Set callback URL list to include production/staging callback domains.

## AISTROYKA Application Wiring

- Web login/register expose `Continue with Apple` (and Google) via `AuthProviderButtons`.
- Redirect target is `GET /api/auth/callback` with safe `next` / `callback` handling.
- Callback (non-recovery) performs:
  - code → session exchange
  - onboarding profile bootstrap (if missing)
  - provider identity mirror into `public.user_identities` when `app_metadata.provider` is `apple` or `google`
  - tenant-membership-aware routing (`/dashboard` or `/dashboard?onboarding=1`)
- Recovery (`recovery=1`) skips identity linking. See `docs/auth/PASSWORD_RECOVERY.md`.

Operator script (does not invent Apple keys; requires an existing `.p8` and `SUPABASE_ACCESS_TOKEN`):

`node apps/web/scripts/enable-auth-apple.mjs`

Defaults in that script match the live team: Services ID `ai.aistroyka.web`, additional Client IDs `ai.aistroyka.worker,ai.aistroyka.manager`, Team `43A4KW5BKB`.

## iOS Native Notes

- Manager and Worker include entitlement `com.apple.developer.applesignin` and a native `SignInWithAppleButton`.
- Shared `AuthService.signInWithApple(...)` exchanges Apple `id_token` against Supabase (`grant_type=id_token`), **not** web OAuth.
- Full name (available only at first Apple consent) is forwarded into Supabase user metadata.
- Existing email/password login remains intact.

## Google (sibling provider)

Do not reuse the Apple Services ID. Google uses a Web application OAuth client in GCP project `aistroyka-auth`.

- Web: same callback as Apple (`/api/auth/callback`).
- iOS: PKCE + `ASWebAuthenticationSession` (`AuthOAuthSession` / `AuthPKCE`) returning to `ai.aistroyka.worker://auth-callback` or `ai.aistroyka.manager://auth-callback`.
- Enable: `node apps/web/scripts/enable-auth-google.mjs` with `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`.
- Keep those custom schemes in the Supabase Redirect URL allow-list (`set-supabase-auth-urls.mjs` merges).

Inventory: `docs/auth/MULTI_PROVIDER_AUTH_INVENTORY.md`.

## Security Notes

- Never commit Apple private key.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and Apple secrets in secure environment storage only.
- Do not make authorization decisions from editable `user_metadata`; tenant/project access stays on membership checks.

## Secret Rotation

- Rotate Apple private key periodically and on any credential exposure.
- Update Supabase provider configuration immediately after rotation.
- Verify end-to-end login in staging after each rotation.
