# Wave 3 — Cross-worker proof report

**Date:** 2026-03-28 (UTC)

---

## F1. Second worker identity

**Not obtained.** No second Supabase user + password in operator env for this verification session.

---

## F2. Peer-owned report id

**Not tested.** Requires:

- User **A** owns report **R**
- User **B** (same tenant, not reviewer) calls `GET /api/v1/reports/R` → expect **404**

---

## F3. What was not counted as proof

Random UUID **404** / **403** — **explicitly excluded** per closure rules (not peer-owned entity denial).

---

## F4. Classification

| Aspect | Status |
|--------|--------|
| **Peer report denial** | **OPEN** |
| **Peer task detail denial** (unassigned real task) | **OPEN** |

---

## F5. Exact operator step

1. Create **user B** (`member`) in same tenant as **user A**.
2. As **A**, ensure a report exists (submitted) with id **R**.
3. As **B**, `GET /api/v1/reports/R` with Bearer + `x-client` as appropriate → **404**.
4. Optionally: task **T** assigned only to **A**; **B** `GET /api/v1/tasks/T` → **403** / **404** per `getTaskForWorker`.

---

## F6. Why Wave 3 stays open (strict)

**No real peer-owned denial proof** + **production not on Wave 3 build** → closure **cannot** be **FULL**.

---

**Status:** **OPEN**
