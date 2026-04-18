# Phase 4 — Runtime Matrix (Hardening Slice 1)

**Date:** 2026-04-18  
**Environment:** `staging`

## Goal

Verify that post-deploy smoke remains blocking but can recover from stale bearer auth when fallback credentials are configured.

## Runs executed

1. [Run 24603384705](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603384705)
2. [Run 24603462240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603462240)

## Observed behavior

- `Build and deploy to staging`: **PASS** in both runs.
- `Post-deploy pilot smoke`: **FAIL** in both runs.
  - failing endpoint: `GET /api/v1/ops/metrics`
  - status: `401 Authentication required`
  - smoke prechecks (`health`, `config`, `cron-tick`) pass.

## Hardening feature evidence

- Second run confirms reusable workflow executed from branch ref:
  - `pilot-smoke.yml@refs/heads/hotfix/phase2-document-runtime-closure`.
- Optional fallback env vars are now wired and visible in logs:
  - `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- In current repository secret state they are empty, so fallback retry cannot mint a token.

## Runtime verdict (slice 1)

- **PARTIAL PASS**: hardening logic is deployed and callable.
- **Closure blocker remains**: fallback secrets are not configured in repository environment, so runtime recovery path cannot engage.
