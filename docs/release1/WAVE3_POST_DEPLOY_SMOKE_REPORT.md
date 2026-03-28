# Wave 3 — Post-deploy smoke report

**Date:** 2026-03-28 (UTC)

---

## Preconditions

**Post-deploy smoke** (Wave 3–meaningful) requires **deploy alignment** first (`health` shows **`8ea1603`** or newer `main`).

**Current:** **`health.sha7` = `3d329d3`** → **post-deploy smoke not executed** as a Wave 3 completion gate.

---

## Canonical command (when aligned)

```bash
set -a
[ -f apps/web/.env.local ] && . apps/web/.env.local
[ -f .env.local ] && . .env.local
set +a
export BASE_URL="${BASE_URL:-https://aistroyka.ai}"
./scripts/smoke/pilot_launch.sh
```

---

## Result (this session)

| Item | Status |
|------|--------|
| **Executed after Wave 3 SHA** | **NO** — blocker: runtime not aligned |
| **Prior pilot smoke** (historical) | **PASS** when env + auth correct — **not** a substitute for post-Wave-3-deploy proof |

---

**Status:** **NOT RUN** (blocked on deploy alignment)
