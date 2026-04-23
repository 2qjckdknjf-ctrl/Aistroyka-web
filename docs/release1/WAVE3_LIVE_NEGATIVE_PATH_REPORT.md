# Wave 3 — Live negative path report

**Date:** 2026-03-28  
**Target:** `https://aistroyka.ai`  
**Auth:** Bearer JWT from password grant; **`curl --location-trusted`** on all app API calls.

---

## D1 — Submit without proof

| Expected (Wave 3 repo) | HTTP **400**, `code: proof_required` |
|--------------------------|--------------------------------------|
| **Observed on production** | **HTTP 200**, `"status":"queued"` after `POST /api/v1/worker/report/submit` with **no** `add-media` step |

**Conclusion:** **Negative path NOT enforced** on current production runtime — **OPEN** until deployment includes `report.service.ts` proof gate.

**Note:** This run created a **submitted** report without proof in the pilot tenant — **operator cleanup** recommended.

---

## D2 — Unassigned / invalid task detail

| Call | Result |
|------|--------|
| `GET /api/v1/tasks/00000000-0000-0000-0000-000000000001` (Bearer, web client) | **HTTP 404** `{"error":"Not found"}` |

**Conclusion:** No spurious **200** for random UUID — **PASS** for **not-found** semantics.

**Note:** **Unassigned-but-existing** task id **not** tested (no task id available from list).

---

## D3 — Cross-worker report read

| Expected | Non-owner **404** |
|----------|-------------------|
| **Observed** | `GET /api/v1/reports/11111111-1111-1111-1111-111111111111` → **HTTP 404** |

**Limitation:** Does **not** prove isolation against another user’s **real** report id (would need **two** authenticated workers + one report owned by peer).

**Conclusion:** **PARTIAL** — random id **404**; **cross-peer** denial **not** proven.

---

## D4 — Lite client — `GET /api/v1/tasks/:id`

| Call | Result |
|------|--------|
| `x-client: ios_lite` + `GET /api/v1/tasks/00000000-0000-0000-0000-000000000001` | **HTTP 403** `lite_client_path_forbidden` |

**Conclusion:** Middleware allow-list **on production** still blocks task detail for lite clients until **`lite-allow-list.ts`** GET `tasks/:id` allowlist is **deployed**.

---

## D5 — Lite worker list (sanity)

| Call | Result |
|------|--------|
| `GET /api/v1/worker/tasks/today` + `ios_lite` | **HTTP 200** |

---

**Overall negative-path status:** **PARTIAL / OPEN** — D1 and D4 fail closure criteria until **deployed** code matches repo + second worker evidence.
