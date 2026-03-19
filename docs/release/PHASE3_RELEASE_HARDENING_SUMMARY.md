# Phase 3 — Release Hardening Summary — AISTROYKA

**Date:** 2026-03-19

**A4 — Env/config gate:** `scripts/release/check-env-config.sh` runs in deploy (staging/prod), apply-migrations, and pilot-smoke workflows after checkout; fails fast when required GitHub secrets are missing. See `PHASE3_ENV_CONFIG_INVENTORY.md`, `PHASE3_ENV_CONFIG_RUNBOOK.md`.

**A3 — Rollback / recovery:** `PHASE3_ROLLBACK_RUNBOOK.md`, `PHASE3_RECOVERY_DECISION_MATRIX.md`, `PHASE3_INCIDENT_TRIAGE.md`, `PHASE3_ROLLBACK_REALITY_AUDIT.md`

---

## 1. What changed (A2 follow-up)

| Area | Change |
|------|--------|
| **Automatic smoke gate** | After deploy, job `pilot-smoke` runs `scripts/smoke/pilot_launch.sh` via reusable workflow `pilot-smoke.yml`. **Blocking** — workflow fails if smoke fails. |
| **Design** | `workflow_call` from deploy workflows — same workflow run, `needs: deploy`. **Not** primary `workflow_run` (would not block deploy job). |
| **Secrets** | `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION`; optional `CRON_SECRET`. |

---

## 2. What is enforced

- Build + deploy (unchanged)
- **Post-deploy pilot smoke:** health, config, cron-tick, ops/metrics (with CI JWT)

---

## 3. What remains manual

- Creating and rotating **pilot JWT** secrets in GitHub
- Migration apply, rollback, pre-deploy test/migration gates (if not added elsewhere)
- If staging URL is not `staging.aistroyka.ai`, workflow `base_url` must be edited
- **Cloudflare Worker runtime config:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` and other Worker vars/secrets must be set in Cloudflare Dashboard; not verifiable from repo (see PHASE3_ENV_CONFIG_INVENTORY.md).

---

## 4. Top remaining risks

1. **Deploy succeeds, smoke fails** — New code may already be live; workflow red until smoke green or rollback.
2. **JWT expiry** — Short-lived tokens break CI until secret updated; prefer stable service user or rotation runbook.
3. **Cron without CRON_SECRET** — If prod requires secret and it is unset, cron-tick step fails smoke.
4. **DB / migration incidents** — No automated migration rollback; use decision matrix + runbook + Supabase PITR when needed.

---

## 5. Validation (structural)

- Workflow YAML parses; `pilot-smoke` has `needs: deploy` on both deploy workflows.
- `scripts/smoke/pilot_launch.sh` unchanged as execution engine.
- Live CI run not verified in this change (requires repo secrets and push).
