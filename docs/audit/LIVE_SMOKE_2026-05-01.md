# LIVE Smoke Verification (2026-05-01)

## Scope

- Run existing smoke flow against production URL:
  - health
  - config
  - cron tick
  - auth-sensitive metrics endpoint

## Executed command

```bash
BASE_URL="https://aistroyka.ai" scripts/smoke/pilot_launch.sh
```

## Output summary

- `PASS: health`
- `PASS: config`
- `PASS: cron-tick (no secret)`
- `FAIL: ops/metrics → HTTP 401 (set COOKIE or AUTH_HEADER, or SMOKE_EMAIL+SMOKE_PASSWORD+Supabase keys)`

Script exit code: `1` (expected when any required check fails).

## Findings

- Public/safe checks passed.
- Auth-sensitive endpoint failed due to missing auth/session material in runtime environment.

## Blockers

- Missing one of:
  - `AUTH_HEADER` (valid user Bearer JWT),
  - `COOKIE` (valid session cookie),
  - `SMOKE_EMAIL` + `SMOKE_PASSWORD` + Supabase URL/anon key to mint token.

## Exact operator command (authenticated smoke)

```bash
BASE_URL="https://aistroyka.ai" \
AUTH_HEADER="Bearer <valid_user_access_token>" \
CRON_SECRET="<secret_if_required_by_env>" \
scripts/smoke/pilot_launch.sh
```

## Verdict

- Smoke verification: **FAIL / BLOCKED (missing auth credentials for protected checks)**.
