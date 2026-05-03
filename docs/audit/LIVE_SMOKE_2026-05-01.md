# LIVE Smoke Verification (2026-05-01)

## Scope

- Run existing smoke script against both production and staging:
  - `health`
  - `config`
  - safe jobs endpoint (`admin/jobs/cron-tick`)
  - auth-sensitive endpoint (`ops/metrics`)

## Executed commands

```bash
BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh
BASE_URL="https://staging.aistroyka.ai" scripts/smoke/pilot_launch.sh
```

## Output summary

Production (`https://aistroyka.ai`):
- `PASS: health`
- `PASS: config`
- `PASS: cron-tick (no secret)`
- `FAIL: ops/metrics → HTTP 401 (set COOKIE or AUTH_HEADER, or SMOKE_EMAIL+SMOKE_PASSWORD+Supabase keys)`
- Exit code: `1`

Staging (`https://staging.aistroyka.ai`):
- `PASS: health`
- `PASS: config`
- `PASS: cron-tick (no secret)`
- `FAIL: ops/metrics → HTTP 401 (set COOKIE or AUTH_HEADER, or SMOKE_EMAIL+SMOKE_PASSWORD+Supabase keys)`
- Exit code: `1`

## Findings

- Non-auth smoke checks passed on both environments.
- Auth-sensitive smoke checks are not verifiable without tenant user auth material.

## External blockers

- Missing one of:
  - `AUTH_HEADER="Bearer <valid_user_access_token>"`
  - `COOKIE="<valid_session_cookie>"`
  - `SMOKE_EMAIL` + `SMOKE_PASSWORD` + (`SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`) + (`SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Operator command to close blocker

```bash
BASE_URL="https://aistroyka.ai" \
AUTH_HEADER="Bearer <valid_user_access_token>" \
CRON_SECRET="<secret_if_required>" \
scripts/smoke/pilot_launch.sh

BASE_URL="https://staging.aistroyka.ai" \
AUTH_HEADER="Bearer <valid_user_access_token>" \
CRON_SECRET="<secret_if_required>" \
scripts/smoke/pilot_launch.sh
```

## Verdict

- **Smoke: BLOCKED** (safe checks PASS, auth-sensitive checks not verified)
