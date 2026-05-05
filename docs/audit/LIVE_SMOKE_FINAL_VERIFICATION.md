# Live Smoke Final Verification

## Inspected files

- `scripts/smoke/pilot_launch.sh`
- `apps/web/app/api/v1/health/route.ts`
- `apps/web/app/api/v1/config/route.ts`
- `apps/web/app/api/v1/admin/jobs/cron-tick/route.ts`
- `apps/web/app/api/v1/ops/metrics/route.ts`

## Commands run

- `BASE_URL="https://staging.aistroyka.ai" scripts/smoke/pilot_launch.sh`
- `BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh`
- env presence checks for smoke inputs (`AUTH_HEADER`, `COOKIE`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, etc.)

## Result

- Staging smoke: PARTIAL FAIL
  - PASS: `health`, `config`, `cron-tick`
  - FAIL: `ops/metrics` -> 401 (missing tenant auth context)
- Production smoke: FAIL
  - `health`, `config`, `cron-tick`, `ops/metrics` -> 500

## Proof summary

- Staging app runtime core checks are healthy; tenant-scoped metrics requires valid user token/cookie.
- Production runtime remains degraded and fails all smoke checks with 500.
- Smoke script behavior is consistent with prior release blockers.

## Changes made

- Verification and reporting only.

## Remaining blockers

- Missing tenant auth for staging `ops/metrics` smoke completion.
- Production runtime 500 incidents unresolved (release-blocking).

## Final verdict

FAIL
