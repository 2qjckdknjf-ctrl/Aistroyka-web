# Wave 3 — Cross-worker proof report

**Date:** 2026-03-28

---

## Requirement

Deny **worker B** reading **worker A**’s report by ID (real peer-owned row), not only random UUID **404**.

---

## E1. Second worker identity

| Item | Status |
|------|--------|
| **Supabase user** for worker B | **Not** available in repo / env for this session. |
| **Tenant membership** aligned with pilot tenant | **Not** provisioned here. |

---

## E2. Peer-owned entity

| Item | Status |
|------|--------|
| **Report id** owned by user A while authenticated as user B | **Not** tested — requires two users + at least one submitted report. |

---

## E3. What was proven instead

| Check | Result |
|-------|--------|
| Random UUID `GET /reports/1111…` | **404** (as non-owner) — **weak** substitute for peer denial. |

---

## Operator steps to close this gap

1. Create **user B** (member) in same tenant as **user A**.
2. Create/submit report as **A**; capture `report_id`.
3. Sign in as **B**; `GET /api/v1/reports/{report_id}` → expect **404** (non-reviewer).

---

**Status:** **OPEN** — **real cross-worker denial not proven.**

---

## Impact on Wave 3 closure

Per strict rules: **closure cannot be FULL** without this proof **unless** explicitly waived by process (not done here).
