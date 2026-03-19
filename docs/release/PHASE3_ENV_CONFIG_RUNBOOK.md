# Phase 3 / A4 — Env / config runbook — AISTROYKA

**Date:** 2026-03-19  
Companion to: `PHASE3_ENV_CONFIG_INVENTORY.md`, `ENVIRONMENT-VARIABLES.md`, `scripts/validate-release-env.mjs`.

---

## 1. What is validated automatically

- **Deploy workflows (staging, production):**  
  After checkout, `scripts/release/check-env-config.sh deploy-staging|deploy-production` runs in the `deploy` job and fails fast if required GitHub secrets are missing in the job environment:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- **Migration workflow:**  
  After checkout, `scripts/release/check-env-config.sh migrations` runs in `apply-migrations.yml` and fails fast if:
  - `SUPABASE_ACCESS_TOKEN` is unset
  - `SUPABASE_PROJECT_REF` is unset
- **Pilot-smoke (reusable workflow):**  
  `scripts/release/check-env-config.sh pilot-smoke` runs with `BASE_URL` from inputs; validates URL format (http(s)://). Bearer secret presence is verified by a separate step in the same workflow.
- **App-level env model (optional gate):**  
  `scripts/validate-release-env.mjs` + `apps/web/lib/config/release-env.ts` validate presence/category of core env (web/jobs/AI/billing/push, debug flags) when run manually with `NODE_ENV=...`.

These gates check **names and presence only** (and BASE_URL format for pilot-smoke), never secret values.

---

## 2. What remains operator responsibility

- Creating and rotating all real secret values (Supabase keys, JWTs, Stripe keys, AI keys, FCM/APNS, etc.).  
- Configuring Cloudflare Worker env/vars for `env.staging` / `env.production` to match `wrangler*.toml` and `ENVIRONMENT-VARIABLES.md`.  
- Ensuring `REQUIRE_CRON_SECRET` / `CRON_SECRET` policy matches the environment and that `CRON_SECRET` is stored only as a secret.  
- Ensuring `PILOT_SMOKE_BEARER_STAGING` / `PILOT_SMOKE_BEARER_PRODUCTION` exist and are valid JWTs for a tenant user.

---

## 3. Where each class of config belongs

- **GitHub repository secret:**  
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION`, optional `CRON_SECRET`.  
- **GitHub environment secret:**  
  `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` for `staging` / `production` (migration workflow).  
- **Cloudflare Worker env/vars:**  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `REQUIRE_CRON_SECRET`, `CRON_SECRET`, other runtime app env (AI/billing/push).  
- **Public build env:**  
  `NEXT_PUBLIC_*` subset (documented in `ENVIRONMENT-VARIABLES.md` and `release-env.ts`).  
- **Local-only `.env` / `.env.local`:**  
  Developer machines; used by `scripts/validate-release-env.mjs` and local Next.js dev. Not required in CI.

---

## 4. When a gate fails (check-env-config.sh)

- **Deploy-staging / deploy-production:**  
  - Error: missing `CLOUDFLARE_*` → add or fix repository secrets under GitHub → Settings → Secrets and variables → Actions.  
  - Rerun workflow or push a no-op commit.
- **Migrations:**  
  - Error: missing `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_REF` → add them at repo or environment secret scope per A1 runbook; do **not** paste tokens into code or docs.  
  - Rerun the workflow with correct `target`.
- **Pilot-smoke:**  
  - Error: `BASE_URL` invalid or missing → caller must pass a valid `base_url` input (workflows always do). If running script locally, set `BASE_URL` to the target URL.

The script may emit `::notice::External-only config...` lines; these are **informational** and do not block CI.

---

## 5. Adding a new required variable safely

1. Decide category: web / jobs / AI / billing / push / debug.  
2. Add it to:
   - `docs/ENVIRONMENT-VARIABLES.md` (production-facing docs), and  
   - `apps/web/lib/config/release-env.ts` if it is part of the release env model.  
3. If it must be present for a given CI workflow:
   - Wire it as a GitHub secret or environment secret.  
   - Optionally extend `scripts/release/check-env-config.sh` to treat it as required for the relevant mode (deploy/migrations).  
4. Do **not** echo the value in logs or commit it to the repo.

---

## 6. Recommended operator checks before first production deploy

- Run once from a machine that has a replica of production env variables (no secrets printed):  
  `NODE_ENV=production node scripts/validate-release-env.mjs`  
- Confirm:
  - Verdict is `PASS` or `PASS_WITH_WARNINGS` (not `FAIL`).  
  - No `debug_forbidden_in_prod` vars set to `true`.  

