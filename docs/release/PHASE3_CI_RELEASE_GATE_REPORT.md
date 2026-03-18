# Phase 3 / A2 — CI Release Gate Report — AISTROYKA

**Date:** 2026-03-18 (A2 automatic post-deploy smoke)

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
| Cloudflare secrets, build, deploy | `deploy` job | Workflow fails before smoke |
| **Pilot smoke** (health, config, cron-tick, ops/metrics) | `pilot-smoke` job after deploy | **Workflow fails**; deploy already reached Cloudflare (operator must fix smoke or rollback app) |
| Bearer JWT present for smoke | `pilot-smoke.yml` verify step | Fails if `pilot_smoke_bearer` secret empty |

**BASE_URL (fixed in workflow):**

| Environment | URL |
|-------------|-----|
| Staging | `https://staging.aistroyka.ai` |
| Production | `https://aistroyka.ai` |

---

## 4. What remains manual

- **GitHub secrets for smoke:** `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION` (Supabase JWT, tenant user). If unset or empty, smoke job fails until configured. Optional: `CRON_SECRET` for cron-tick when `REQUIRE_CRON_SECRET=true`.
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
