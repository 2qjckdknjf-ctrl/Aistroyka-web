# Phase 3 — CI Release Gate Report — AISTROYKA

**Date:** 2026-03-19

**A4 env/config gate:** Before build/deploy, each workflow runs `scripts/release/check-env-config.sh` (after checkout). Deploy-staging and deploy-production require `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Migrations require `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`. Pilot-smoke validates `BASE_URL` format. What remains external: GitHub secret values, Cloudflare Worker vars (e.g. `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Biggest config risk: production Worker missing ANON_KEY (see PHASE3_ENV_CONFIG_INVENTORY.md §7).

**A3 recovery:** When deploy or smoke fails, see **`PHASE3_ROLLBACK_RUNBOOK.md`**, **`PHASE3_RECOVERY_DECISION_MATRIX.md`**, **`PHASE3_ROLLBACK_REALITY_AUDIT.md`**.

---

## 1. Workflows inspected

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/deploy-cloudflare-prod.yml` | push to main, workflow_dispatch | Production deploy → **blocking** pilot smoke |
| `.github/workflows/deploy-cloudflare-staging.yml` | push to develop | Staging deploy → **blocking** pilot smoke |
| `.github/workflows/pilot-smoke.yml` | `workflow_call` only | Reusable smoke job (not `workflow_run`) |
| `.github/workflows/apply-migrations.yml` | workflow_dispatch | Supabase migrations (A1) |

**Deploy → smoke pattern:** Job `deploy` completes (wrangler deploy). Job `pilot-smoke` runs with `needs: deploy` and **fails the workflow** if `scripts/smoke/pilot_launch.sh` exits non-zero. Smoke does **not** use `workflow_run` as the primary gate (that would run after the deploy workflow already finished green).

**Prod deploy job steps:** Secrets → Checkout → Bun → Install → Build → Verify output → Patch bundle → Deploy → Summary.

**Staging deploy job steps:** Secrets → Checkout → Bun → Install → Build → Verify → Deploy → Summary.

**Not in deploy workflows:** Migration sanity and full test suite before build (separate decision).

---

## 2. Current release path

1. **Code:** Push to `develop` (staging) or `main` (prod).
2. **CI:** Build + deploy to Cloudflare; then **automatic blocking smoke** against public BASE_URL.
3. **Migrations:** Separate workflow or manual (A1).
4. **Manual smoke (fallback / extra):** Operators may still run `npm run smoke:pilot` locally or against another URL for debugging.

---

## 3. What is enforced automatically

| Check | Where | Failure behavior |
|-------|--------|------------------|
| **Env/config gate** | First steps after checkout in deploy, migrations, pilot-smoke | Fails fast if required secrets (CLOUDFLARE_*, SUPABASE_* for migrations) or BASE_URL format (pilot-smoke) invalid; see `scripts/release/check-env-config.sh` |
| Cloudflare secrets, build, deploy | `deploy` job | Workflow fails before smoke |
| **Pilot smoke** (health, config, cron-tick, ops/metrics) | `pilot-smoke` job after deploy | **Workflow fails**; deploy already reached Cloudflare (operator must fix smoke or rollback app) |
| Bearer JWT present for smoke | `pilot-smoke.yml` verify step | Fails if `pilot_smoke_bearer` secret empty |

**BASE_URL (fixed in workflow):**

| Environment | URL |
|-------------|-----|
| Staging | `https://staging.aistroyka.ai` |
| Production | `https://aistroyka.ai` |

---

## 4. What remains manual / external

- **GitHub secrets for smoke:** `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION` (Supabase JWT, tenant user). If unset or empty, smoke job fails until configured. Optional: `CRON_SECRET` for cron-tick when `REQUIRE_CRON_SECRET=true`.
- **Cloudflare Worker runtime:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` and other Worker vars/secrets — must be set in Cloudflare Dashboard; not verified by CI (biggest config risk: missing ANON_KEY in production).
- **Migration apply, rollback, pre-deploy tests** — unchanged.

---

## 5. Smoke targets (real endpoints)

| Target | Path | Auth |
|--------|------|------|
| Health | `GET /api/v1/health` | None |
| Config | `GET /api/v1/config` | None |
| Cron | `POST /api/v1/admin/jobs/cron-tick` | `x-cron-secret` if required |
| Ops/metrics | `GET /api/v1/ops/metrics` | `Authorization: Bearer <JWT>` from CI secret |

---

## 6. Scripts

- **Engine:** `scripts/smoke/pilot_launch.sh`
- **Reusable workflow:** `.github/workflows/pilot-smoke.yml`

See `docs/release/PHASE3_PILOT_SMOKE_USAGE.md` for secrets and operator commands.

---

## 7. Recovery context (A3)

- **Smoke red after green deploy:** Worker already updated; recovery is **operational** (revert web / fix secrets / hotfix), not “undo deploy” in CI.
- **Full picture:** `PHASE3_ROLLBACK_REALITY_AUDIT.md`, `PHASE3_INCIDENT_TRIAGE.md`.
