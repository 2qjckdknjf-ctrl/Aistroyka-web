# Live verification — credentials matrix

**Date:** 2026-05-08  
**Rule:** Values are never logged here. Columns are presence in the **operator environment** used for the run (`printenv` / `.env.local` / `.env.pilot`), not in CI secrets unless noted.

| Variable | Present (this run) | Required for | Safe to log value | Blocking if missing |
|----------|---------------------|--------------|-------------------|---------------------|
| `SUPABASE_ACCESS_TOKEN` | YES (CLI still **Unauthorized** — token invalid/revoked/wrong type) | `supabase projects list`, `link`, `migration list` | NO | YES for **live** CLI verification |
| `SUPABASE_PROJECT_REF` | NO (derivable from `NEXT_PUBLIC_SUPABASE_URL` host prefix) | `supabase link --project-ref` | NO (ref is non-secret; still omit in shared logs) | YES for linked CLI |
| `DATABASE_URL` / `SUPABASE_DB_URL` | YES (in local env) | DB clients, optional SQL | NO | NO for smoke/E2E |
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Smoke password-grant, app | NO | YES for smoke path C |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Smoke password-grant, app | NO | YES for smoke path C |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder in one env file | Server routes needing service role | NO | YES for some API paths in prod |
| `AUTH_HEADER` | NO | Smoke path A (`ops/metrics`) | NO | NO if password grant works |
| `COOKIE` | NO | Smoke path B | NO | NO if password grant works |
| `SMOKE_EMAIL` | YES | Smoke path C, E2E fallback in `requireE2eCredentials` | NO | YES for scripted smoke without Bearer |
| `SMOKE_PASSWORD` | YES | Smoke path C, E2E fallback | NO | YES |
| `PILOT_SMOKE_*` | NO | CI / named pilot scripts | NO | NO if `SMOKE_*` set |
| `E2E_EMAIL` / `E2E_PASSWORD` | NO (fallback used `SMOKE_*`) | Explicit E2E | NO | NO if `SMOKE_*` accepted |
| `PLAYWRIGHT_BASE_URL` | Set for run (`https://staging.aistroyka.ai`) | Playwright | YES (URL) | YES for remote E2E |
| `PILOT_E2E_BASE_URL` / `PILOT_E2E_EMAIL` / `PILOT_E2E_PASSWORD` | N/A in local shell | GitHub `pilot-e2e-audit.yml` | NO | YES in CI for that workflow |
| `SYSTEM_API_KEY` | Unknown / not used in curl | Positive-key `X-System-Key` checks | NO | NO for public health/smoke |
| `CRON_SECRET` | Unknown | Cron-tick when server requires | NO | NO (smoke used no-secret path) |

## Groups

### Supabase CLI verification
Needs valid **`SUPABASE_ACCESS_TOKEN`** (Supabase **management** PAT) plus **`SUPABASE_PROJECT_REF`** (or link via dashboard). This run: **`supabase projects list` → Unauthorized** despite a token-shaped env var → treat as **BLOCKED** until token is renewed.

### Full smoke (`scripts/smoke/pilot_launch.sh`)
Needs **`BASE_URL`** plus tenant auth for `ops/metrics` (Bearer / cookie / `SMOKE_EMAIL`+`SMOKE_PASSWORD`+Supabase URL+anon). This run: **PASS** on staging and production with password-grant path.

### E2E pilot (`e2e:pilot` suite)
Needs reachable **`PLAYWRIGHT_BASE_URL`** and credentials (`E2E_*` or `SMOKE_*` per `auth.ts`). This run: **executed** → **FAIL** (see `FINAL_E2E_REPORT.md`).

### System routes
Unauthorized calls to `/api/v1/system/health`: expect **401/503** with JSON policy — not uncontrolled **500**. Positive verification needs **`SYSTEM_API_KEY`** (not exercised here).
