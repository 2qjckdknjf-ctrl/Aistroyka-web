# Live Smoke Final Verification

## Inspected files

- `scripts/smoke/pilot_launch.sh`
- `apps/web/app/api/v1/health/route.ts`
- `apps/web/app/api/v1/config/route.ts`
- `apps/web/app/api/v1/admin/jobs/cron-tick/route.ts`
- `apps/web/app/api/v1/ops/metrics/route.ts`

## Commands run (2026-05-07)

- `curl -sS -o /dev/null -w '%{http_code}' https://staging.aistroyka.ai/api/v1/health` → **200**
- `curl -sS -o /dev/null -w '%{http_code}' https://aistroyka.ai/api/v1/health` → **200**
- `curl -sS -o /dev/null -w '%{http_code}' https://www.aistroyka.ai/api/v1/health` → **200**
- `BASE_URL="https://staging.aistroyka.ai" bash scripts/smoke/pilot_launch.sh` (no auth env)
- `BASE_URL="https://aistroyka.ai" bash scripts/smoke/pilot_launch.sh` (no auth env)
- `printenv | grep -E 'SMOKE_|AUTH_HEADER|COOKIE|PILOT_E2E_|E2E_'` — **no credentials** in automation shell

## Result

### Unauthenticated `pilot_launch.sh` (both staging and production)

- **PASS:** `health`, `config`, `cron-tick` (script’s no-secret cron path)
- **FAIL:** `ops/metrics` → **HTTP 401** — script instructs: set `COOKIE` or `AUTH_HEADER`, or `SMOKE_EMAIL` + `SMOKE_PASSWORD` + `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see script header)

**Overall script exit:** non-zero (expected until tenant auth is provided for metrics).

### Public health sanity

- Apex and `www` **`/api/v1/health`** return **200** (2026-05-07 check).
- This is **not** a substitute for a full credentialed smoke or E2E pass.

### Historical note (superseded)

Earlier notes claimed production smoke failed with **500** on all checks. The **2026-05-07** rerun shows the **same** pattern as staging: core routes pass without auth; **`ops/metrics` requires auth** (401). Legacy **`/api/system/health`** behavior may still differ — track separately in `DEEP_PRODUCTION_COMPLETION_VALIDATION_LOG.md` if needed.

## Changes made

- Documentation / verification only.

## Remaining blockers

- **Full staging smoke PASS** needs tenant JWT/session (or smoke email path + Supabase public env).
- **Full production smoke PASS** needs the same, run only under operator policy.
- **E2E** remains credential-blocked in this environment (`FINAL_E2E_REPORT.md`).

## Final verdict

**PARTIAL / OPERATOR-BLOCKED** — public health OK; **`pilot_launch.sh` not green** without auth for `ops/metrics`. Do **not** treat as production go-live sign-off.
