# Runtime Review Env Status — 2026-06-20

## Scripts
- Root:
  - `dev`
  - `start`
  - `smoke:pilot`
  - `smoke:pilot:check`
  - `audit:e2e`
  - `cf:build`
- `apps/web`:
  - `dev`
  - `start`
  - `e2e`
  - `e2e:pilot`
  - `smoke:auth`
  - `smoke:staging`
  - `smoke:prod`

## Required Local Env
Names only:
- Supabase public URL/key: available in gitignored env files.
- E2E credentials: available by variable name in gitignored `.env.pilot`.
- E2E project ID: available by variable name in gitignored `.env.pilot`.

## Runtime Mode
- Local app: `LOCAL_BROWSER_AVAILABLE` for unauthenticated app reachability.
- Authenticated browser: `BLOCKED_NO_AUTH_SESSION` because no browser session was available and secrets were not injected into browser tools.
- API runtime: available and executed with gitignored env values.

## Classification
- Browser UI verification: PARTIAL.
- API runtime verification: PASS for owner session export route.
