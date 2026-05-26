# Live Strict Smoke Report

## Goal

Verify strict pilot smoke runtime against real target environment.

## Runtime evidence (live)

- Source: production deploy workflow run  
  <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26146584712>
- Blocking job: **Post-deploy pilot smoke (blocking)** -> success
- Workflow details show `scripts/smoke/pilot_launch.sh` executed with real runtime secrets and exited successfully.

## Local strict prereq check (current shell)

Command:

```bash
bun run smoke:pilot:check --strict
```

Result: failed in local shell due missing env/credentials:

- `BASE_URL`
- auth path for ops metrics (`AUTH_HEADER` or `COOKIE` or smoke credentials + Supabase vars)
- `E2E_EMAIL` / `E2E_PASSWORD`
- `PLAYWRIGHT_BASE_URL`
- `SUPABASE_ACCESS_TOKEN`

## Interpretation

1. **Runtime strict smoke proof is available and passing** in production pipeline with configured secrets.
2. Local strict smoke reproducibility is environment-blocked in this terminal session.

## Verdict

**CLOSED (runtime proof), with local env reproduction blocked external**

## Operator command (for local strict reproduction)

```bash
export BASE_URL='https://aistroyka.ai'
export PLAYWRIGHT_BASE_URL="$BASE_URL"
export AUTH_HEADER='Bearer <tenant_user_jwt>' # or COOKIE / smoke credential path
export E2E_EMAIL='<pilot-user-email>'
export E2E_PASSWORD='<pilot-user-password>'
export SUPABASE_ACCESS_TOKEN='<supabase_pat>'
bun run smoke:pilot:check --strict
```

