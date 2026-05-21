# Phase 3 Release Gate Hardening (2026-05-20)

## Scope

- Strengthen CI gate to include explicit TypeScript typecheck.
- Tighten deploy env/config prechecks so missing release-critical values fail early.
- Keep smoke gate blocking and non-zero on failure.

## Implemented

1. `CI Check` workflow now runs `bunx tsc --noEmit` in `apps/web` before tests.
2. `scripts/release/check-env-config.sh` now enforces for deploy modes:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_APP_ENV`
   - `PILOT_SMOKE_BEARER`
3. Deploy workflows pass required envs into env/config check steps for both staging and production.
4. Existing blocking smoke design remains unchanged:
   - deploy -> reusable `pilot-smoke` -> non-zero on failure.

## Validation

- `bash -n` checks passed for release/smoke scripts.
- `check-env-config.sh` modes validated with representative envs.
- `bunx tsc --noEmit` passed in `apps/web`.

## Notes

- Runtime-only secrets (example: `SYSTEM_API_KEY`, `CRON_SECRET`) remain dashboard-managed and are documented as external checks.
- No secret values are logged by the check script.

