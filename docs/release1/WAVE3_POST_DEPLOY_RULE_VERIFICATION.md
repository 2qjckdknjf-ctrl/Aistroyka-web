# Wave 3 — Post-deploy rule verification

**Date:** 2026-03-28 (UTC)  
**Target:** `https://aistroyka.ai`  
**Runtime stamp observed:** `3d329d3` (**pre–Wave 3** deploy)

---

## Preconditions

Auth: Supabase password grant from operator `.env.local` (not printed). All `curl` to `BASE_URL` use **`--location-trusted`**.

---

## D1. Submit without proof

| Expected (Wave 3 `8ea16034`) | HTTP **400**, `code: proof_required` |
|------------------------------|--------------------------------------|
| **Command** | `POST /api/v1/worker/report/create` (empty body) → `POST /api/v1/worker/report/submit` with `report_id` only |
| **Actual** | **HTTP 200**, body includes `"status":"queued"`, `jobIds` populated |
| **Conclusion** | **FAIL** vs Wave 3 — runtime **not** serving proof gate |

---

## D2. Lite `GET /api/v1/tasks/:id` (bogus UUID)

| Expected (`8ea16034` lite allow-list) | **Not** `403` `lite_client_path_forbidden`; typically **404** for unknown id |
|---------------------------------------|----------------------------------|
| **Command** | `GET .../tasks/00000000-0000-0000-0000-000000000001` + `x-client: ios_lite` |
| **Actual** | **HTTP 403** `{"error":"forbidden","code":"lite_client_path_forbidden"}` |
| **Conclusion** | **Stale** middleware vs repo — deploy not updated |

---

## D3. Lite `GET /api/v1/reports/:id` (bogus UUID)

| Expected | Route reached → **404** for non-existent |
|----------|------------------------------------------|
| **Actual** | **HTTP 403** `lite_client_path_forbidden` |
| **Conclusion** | **Stale** — same as D2 |

---

## D4. Stale behavior remaining?

**YES** — D1–D3 all inconsistent with **`8ea16034`**.

---

## After deploy (operator re-run)

Repeat D1–D3 when **`health.sha7`** ≥ Wave 3; expect D1 **400**, D2/D3 **404** (not 403).

---

**Status:** **OPEN** (current runtime)
