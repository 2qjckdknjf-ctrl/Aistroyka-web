# STAGE 03 — Release Gate / Smoke / Env Config Report

## 1. Goal

Make release verification harder to skip by enforcing typecheck + env gate + smoke gate behavior in the real CI/CD path.

## 2. Files inspected

- `.github/workflows/ci-check.yml`
- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.github/workflows/pilot-smoke.yml`
- `.github/workflows/pilot-e2e-audit.yml`
- `scripts/smoke/pilot_launch.sh`
- `scripts/release/smoke-gate.sh`
- `scripts/release/check-env-config.sh`
- `scripts/release/check-migrations.sh`
- `docs/release/*` (existing runbooks and Phase 3 docs)

## 3. Findings

1. Existing release chain already has blocking post-deploy smoke via reusable `pilot-smoke`.
2. `ci-check` lacked explicit TypeScript typecheck step.
3. Env/config gate existed but did not enforce full deploy-time/public config and smoke bearer prerequisites.
4. Smoke script already exits non-zero on failures and checks safe operational routes (`/api/v1/health`, `/api/v1/config`, guarded metrics, cron tick policy).

## 4. Changes made

1. Added typecheck to PR gate:
   - `.github/workflows/ci-check.yml` now runs `bunx tsc --noEmit` in `apps/web`.
2. Hardened env/config gate:
   - `scripts/release/check-env-config.sh` now validates deploy mode requirements for Cloudflare, build-time public vars, and pilot smoke bearer.
3. Wired deploy workflows to pass required variables into env check:
   - `.github/workflows/deploy-cloudflare-staging.yml`
   - `.github/workflows/deploy-cloudflare-prod.yml`
4. Added release doc:
   - `docs/release/PHASE3_RELEASE_GATE_HARDENING_20260520.md`

## 5. Validation commands

```bash
bash -n scripts/release/check-env-config.sh
bash -n scripts/release/check-migrations.sh
bash -n scripts/release/smoke-gate.sh
bash -n scripts/smoke/pilot_launch.sh
bash scripts/release/check-env-config.sh pilot-smoke
CLOUDFLARE_API_TOKEN=x CLOUDFLARE_ACCOUNT_ID=x NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=x NEXT_PUBLIC_APP_URL=https://aistroyka.ai NEXT_PUBLIC_APP_ENV=production PILOT_SMOKE_BEARER=x bash scripts/release/check-env-config.sh deploy-production
bunx tsc --noEmit   # from apps/web
```

## 6. Validation result

- Script syntax checks passed.
- Env gate checks passed for tested modes.
- Typecheck passed in `apps/web`.
- Existing smoke script behavior remains blocking (`exit 1` on failure conditions).

## 7. Remaining gaps

1. Full GitHub workflow YAML lint was not executed locally (tooling absent in repo), so runtime workflow validation still depends on CI execution.
2. Live post-deploy smoke still requires valid secrets and deployed target.

## 8. Blockers

- External-only: repository cannot verify dashboard-managed runtime secrets from local checkout.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

CLOSED

