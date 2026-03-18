# Phase 3 / A2 — Release Hardening Summary — AISTROYKA

**Date:** 2026-03-18

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

---

## 4. Top remaining risks

1. **Deploy succeeds, smoke fails** — New code may already be live; workflow red until smoke green or rollback.
2. **JWT expiry** — Short-lived tokens break CI until secret updated; prefer stable service user or rotation runbook.
3. **Cron without CRON_SECRET** — If prod requires secret and it is unset, cron-tick step fails smoke.

---

## 5. Validation (structural)

- Workflow YAML parses; `pilot-smoke` has `needs: deploy` on both deploy workflows.
- `scripts/smoke/pilot_launch.sh` unchanged as execution engine.
- Live CI run not verified in this change (requires repo secrets and push).
