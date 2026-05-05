# Production Release Go / No-Go

## Local validation

- TypeScript: PASS
- Lint: PASS
- Tests: PASS (`247` files / `1357` tests)
- Build: PASS
- Cloudflare/OpenNext build: PASS

## Live Supabase

EXTERNALLY BLOCKED  
Missing `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`; cannot verify linked migration history or dry-run diff against target project.

## System route security

FAIL  
Production `/api/system/health` and `/api/v1/system/health` return HTTP 500 for no-key/wrong-key checks. No operational payload leak observed, but explicit policy-conformant auth behavior and valid-key path are not proven.

## Smoke

Staging: FAIL (partial)  
- PASS: health/config/cron  
- FAIL: ops/metrics (401 without tenant auth token/cookie)

Production: FAIL  
- Core smoke endpoints (`health/config/cron/metrics`) currently return 500.
- Root page (`/`) also returns 500 on production while staging root responds with 307 redirect.
- Direct production redeploy from this session is blocked by Cloudflare code `10027` (Worker size > 3 MiB plan limit).

## Documents workflow

PASS  
Document policy/service/decision route tests pass; route auth guard on staging returns 401 without auth; full baseline validation green.

## Budget/Cost

EXTERNALLY BLOCKED  
Local cost domain tests pass and schema exists in migrations, but live DB/runtime verification against target Supabase project is blocked by missing credentials and tenant auth.

## iOS runtime E2E

EXTERNALLY BLOCKED  
Worker/Manager simulator builds pass, but runtime login/sync/report/upload/submit verification lacks credentials and there is no automated iOS UI test suite in repo.

## Remaining P0

- Production smoke endpoints returning 500 (`/api/v1/health`, `/api/v1/config`, `/api/v1/admin/jobs/cron-tick`, `/api/v1/ops/metrics`)
- Production system routes returning 500 on unauthorized checks (policy behavior not healthy)
- Production recovery deploy blocked by Cloudflare Worker size-plan limit (`10027`, bundle exceeds 3 MiB limit)

## Remaining P1

- Missing live Supabase operator credentials/project ref for release verification
- Missing tenant auth material for staging smoke `ops/metrics`
- Missing iOS runtime test credentials/manual E2E evidence

## Recovery Runbook

- `docs/release/PRODUCTION_RECOVERY_UNBLOCK_RUNBOOK.md`

## Final decision

Production release: NO-GO  
Pilot release: GO WITH LIMITATIONS
