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

- Web login/register now expose `Continue with Apple`.
- Redirect target is `GET /api/auth/callback` with safe `next` handling.
- Callback performs:
  - code -> session exchange
  - onboarding profile bootstrap (if missing)
  - provider identity mirror into `public.user_identities`
  - tenant-membership-aware routing (`/dashboard` or `/dashboard?onboarding=1`)

## iOS Native Notes

- Manager and Worker login views now include native `SignInWithAppleButton`.
- Shared `AuthService.signInWithApple(...)` exchanges Apple `id_token` against Supabase.
- Full name (available only at first Apple consent) is forwarded into Supabase user metadata.
- Existing email/password login remains intact.

## Security Notes

- Never commit Apple private key.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and Apple secrets in secure environment storage only.
- Do not make authorization decisions from editable `user_metadata`; tenant/project access stays on membership checks.

## Secret Rotation

- Rotate Apple private key periodically and on any credential exposure.
- Update Supabase provider configuration immediately after rotation.
- Verify end-to-end login in staging after each rotation.
