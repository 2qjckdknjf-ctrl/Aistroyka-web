# Password recovery

Operator/developer runbook for the web forgot → email → reset → login flow shipped in Phase 2 / PR #240.

Do not treat this as live mailbox proof. Route-live ≠ email delivered.

## Intent

Users who forget their password can request a reset from the public login surface without enumerating accounts on a well-formed email, then set a new password inside a short-lived recovery session. After a successful update the recovery session is signed out and they must log in again.

## Surfaces

| Kind | Path | Notes |
|------|------|--------|
| Page | `/{locale}/forgot-password` | Locale: `en` / `ru` / `es` / `it`. Linked from login. |
| Page | `/{locale}/reset-password` | Requires a recovery session; otherwise shows “invalid or expired”. |
| API (canonical) | `POST /api/v1/auth/forgot-password` | Re-export of `/api/auth/forgot-password`. |
| API (canonical) | `POST /api/v1/auth/reset-password` | Re-export of `/api/auth/reset-password`. |
| Callback | `GET /api/auth/callback?code=…&callback=/{locale}/reset-password&recovery=1` | Exchanges the Supabase code, then stays on reset (skips post-auth onboarding). |

Implementation: `apps/web/lib/auth/password-recovery.ts`, `apps/web/app/api/auth/forgot-password/route.ts`, `apps/web/app/api/auth/reset-password/route.ts`, `apps/web/app/api/auth/callback/route.ts`.

## Happy path

1. User opens `/{locale}/login` → **Forgot password**.
2. Page `POST`s `{ email, locale }` to `/api/v1/auth/forgot-password`.
3. Server calls Supabase `resetPasswordForEmail` with:

   ```
   {origin}/api/auth/callback?callback=%2F{locale}%2Freset-password&recovery=1
   ```

   Example (production, English):

   `https://aistroyka.ai/api/auth/callback?callback=%2Fen%2Freset-password&recovery=1`

4. User follows the email link. Callback exchanges `code` for a session. When `recovery=1`, it redirects to the sanitized `callback` path (default `/{locale}/reset-password`) and **does not** run Apple identity linking or onboarding.
5. Reset page checks `supabase.auth.getSession()`. If present, user submits `{ password, confirmPassword }` to `/api/v1/auth/reset-password`.
6. Server requires `getUser()` (401 if missing), `updateUser({ password })`, then `signOut()`.
7. Client navigates to `/{locale}/login?reset=success` (login shows the password-updated alert).

## Contracts and constraints

| Rule | Behavior |
|------|----------|
| Locales | `en`, `ru`, `es`, `it` only (`isAuthLocale`). Unknown locale falls back to `en` on forgot-password. |
| Email shape | Missing/invalid email → **400**. Valid shape is required before Supabase is called. |
| Anti-enumeration | On valid email + successful Supabase accept → **200** `{ ok: true }` whether or not the mailbox exists. |
| New password | Minimum **8** characters; `password` must equal `confirmPassword`. |
| Open redirects | `toSafeRelativePath` rejects `//`, `\\`, scheme-relative, and control-character bypasses. |
| Auth-page bounce | Middleware `AUTH_PREFIXES` includes `/login`, `/register`, `/forgot-password` only. **`/reset-password` is excluded** so a recovery session is not redirected to dashboard before the password is set. |
| Logged-in forgot-password | An already-authenticated user hitting `/forgot-password` is sent through `resolvePostAuthEntry` (usually dashboard). |
| Rate limit | Forgot-password: IP limit **10/min** (`DEFAULT_IP_LIMIT`) via `checkRateLimit` on `/api/auth/forgot-password` when the admin client exists. Login is stricter (**5/min**). Reset-password has **no** route-level rate limit. |
| Client IP | Forgot-password uses `getRequestClientIp` (`cf-connecting-ip` → first `x-forwarded-for` → `x-real-ip`). Login still reads `x-forwarded-for` / `x-real-ip` directly. |
| Failures | Missing Supabase env → **503**. Rate limited → **429**. Supabase `resetPasswordForEmail` error → **500** (generic message). Expired/missing recovery session on reset → **401**. |

**200 is not proof the mailbox exists.** It only means the route accepted a well-formed email and Supabase did not error.

## Setup (Supabase + deploy)

Password recovery emails use the **request origin**, not a hardcoded host.

1. In Supabase **Authentication → URL Configuration**, Redirect URLs must allow the callback on every origin that sends mail:
   - Production: `https://aistroyka.ai/**` and `https://www.aistroyka.ai/**` (see `docs/SUPABASE_AUTH_PROD_SETUP.md`).
   - Staging: add `https://staging.aistroyka.ai/**` or the recovery emails opened from staging will fail with “invalid redirect URL”.
2. Site URL should match the environment users click from (staging vs production).
3. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL` must be present at **build** time for Cloudflare/OpenNext (client bundle) and at runtime for the Worker.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `POST /api/v1/auth/forgot-password` → **404** | Route not on that deploy | Confirm `buildStamp.sha7` includes PR #240+. Probe: `bash scripts/pilot/verify_forgot_password_route.sh https://staging.aistroyka.ai`. `run_day0_staging_rehearsal.sh` still prints “expected until PR #240 merge” on 404 — treat that as a stale hint after #240 landed, not current merge status. |
| Probe returns **400 / 200 / 429 / 503** | Route is live | Expected for `verify_forgot_password_route.sh` (uses `probe@example.com`). |
| Email never arrives | Supabase SMTP / Redirect URL / Site URL | Check Auth URL config for that origin; 200 from the API is not delivery proof. |
| “Invalid redirect URL” | Origin missing from Redirect URLs | Add the exact origin pattern; recovery `redirectTo` is `{origin}/api/auth/callback?…`. |
| Reset page: invalid or expired link | No recovery session (opened `/reset-password` cold, or `code` exchange failed) | Request a new link. Callback errors land on `/{locale}/login?error=oauth_exchange_failed` or `missing_code`. |
| User bounced to dashboard before setting a password | `/reset-password` accidentally added to `AUTH_PREFIXES` | Keep reset **out** of the logged-in auth-page bounce list. |
| 429 on forgot-password | IP slot exhausted (10/min) | Wait; confirm you are hitting the intended IP header (`cf-connecting-ip` on Cloudflare). |
| 503 | Missing `NEXT_PUBLIC_SUPABASE_*` | `/api/auth/diag` → `anonKeyPresent` / `supabaseUrlHost`. |

## Tests

| Layer | Location |
|-------|----------|
| Helpers | `apps/web/lib/auth/password-recovery.test.ts` |
| Forgot route | `apps/web/app/api/auth/forgot-password/route.test.ts` |
| Callback recovery | `apps/web/app/api/auth/callback/route.test.ts` |
| Unauthenticated UI smoke | `apps/web/tests/e2e/auth-recovery-smoke.spec.ts` |

Live mailbox delivery is **not** covered by CI.

## Related

- Post-login landing and dual-role cabinet: `docs/architecture/ENTRY_ROUTING_POLICY.md`
- Auth inventory: `docs/auth/MULTI_PROVIDER_AUTH_INVENTORY.md`
- API table: `docs/API-v1-ENDPOINTS.md`
- Config diag: `docs/AUTH_DIAG.md`
