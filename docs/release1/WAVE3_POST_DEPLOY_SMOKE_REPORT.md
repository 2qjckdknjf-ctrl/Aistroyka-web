# Wave 3 — Post-deploy smoke report

**Date:** 2026-03-28

---

## Preconditions

Post-deploy smoke for **Wave 3 behavior** is meaningful only after production serves build **`8ea1603`** (or later from `main`).

At documentation time, **`GET /api/v1/health`** still reported **`sha7: 3d329d3`**.

---

## Command (canonical)

```bash
cd /path/to/AISTROYKA
set -a; [ -f apps/web/.env.local ] && . apps/web/.env.local; [ -f .env.local ] && . .env.local; set +a
export BASE_URL="${BASE_URL:-https://aistroyka.ai}"
./scripts/smoke/pilot_launch.sh
```

---

## Result (this session, after push)

| Step | Result |
|------|--------|
| Script executed | **Not re-run** after push (deploy SHA unchanged on health). |
| **Expected after deploy** | Same as prior: health, config, cron, ops/metrics **PASS** with valid auth. |

---

## Wave 3 relation

`pilot_launch.sh` does **not** assert `proof_required` or lite `tasks`/`reports` paths — **supplement** with `WAVE3_POST_DEPLOY_RULE_VERIFICATION.md` checks.

---

**Status:** **PENDING** new production build — **not** a post-deploy smoke **PASS** for Wave 3–specific rules yet.
