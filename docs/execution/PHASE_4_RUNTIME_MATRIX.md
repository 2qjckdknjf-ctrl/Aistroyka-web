# Phase 4 — Runtime Matrix (Hardening Slice 1)

**Date:** 2026-04-18  
**Environment:** `staging`

## Goal

Verify that post-deploy smoke remains blocking but can recover from stale bearer auth when fallback credentials are configured.

## Runs executed

1. [Run 24603384705](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603384705)
2. [Run 24603462240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603462240)
3. [Run 24603643210](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603643210)
4. [Run 24603699130](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603699130)

## Observed behavior

- `Build and deploy to staging`: **PASS** in all runs.
- `Post-deploy pilot smoke`:
  - **FAIL** in runs 24603384705 and 24603462240 (pre-secret remediation state),
  - **PASS** in run 24603643210 after refreshing `PILOT_SMOKE_BEARER_STAGING`,
  - **PASS** in run 24603699130 with intentionally invalid bearer, proving fallback path works.
  - failing endpoint: `GET /api/v1/ops/metrics`
  - status: `401 Authentication required`
  - smoke prechecks (`health`, `config`, `cron-tick`) pass.

## Hardening feature evidence

- Second run confirms reusable workflow executed from branch ref:
  - `pilot-smoke.yml@refs/heads/hotfix/phase2-document-runtime-closure`.
- Optional fallback env vars are now wired and visible in logs:
  - `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Through MCP + GitHub secret updates, staging fallback inputs were configured:
  - `PILOT_SMOKE_EMAIL_STAGING`
  - `PILOT_SMOKE_PASSWORD_STAGING`
  - `NEXT_PUBLIC_SUPABASE_URL_STAGING`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- Run `24603699130` was executed with an intentionally invalid `PILOT_SMOKE_BEARER_STAGING` and still passed smoke, confirming runtime retry + token mint behavior.

## Runtime verdict (slice 1)

- **PASS**: hardening logic is deployed, configured, and runtime-proven under failure injection.
