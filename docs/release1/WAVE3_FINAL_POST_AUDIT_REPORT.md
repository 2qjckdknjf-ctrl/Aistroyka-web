# Wave 3 — Final post-audit report (strict)

**Date:** 2026-03-28  
**Rules:** No softening; **FULL** only when live/runtime proof matches criteria.

---

## 1. Photo proof enforcement

| Class | Rationale |
|-------|-----------|
| **Repo** | **FULL** — `submitReport` requires ≥1 media row; `proof_required` + route **400**. |
| **Production live** | **OPEN** — `POST /worker/report/submit` **without** media returned **HTTP 200** / queued — deployed runtime **does not** match repo (deploy lag or unreleased build). |

**Overall:** **PARTIAL** (implementation exists; **live not FULL**).

---

## 2. Worker task detail access scope

| Class | Rationale |
|-------|-----------|
| **Repo** | **FULL** — `getTaskForWorker` + `GET` handler branch. |
| **Live assigned task** | **OPEN** — **no** task in `worker/tasks/today` for pilot user; **not** proven for real id. |
| **Live bogus id** | **FULL** — **404** `Not found` (with `--location-trusted`). |
| **Lite client** | **OPEN** on prod — **403** `lite_client_path_forbidden` until allow-list deploy. |

**Overall:** **PARTIAL**.

---

## 3. Worker report read scope

| Class | Rationale |
|-------|-----------|
| **Repo** | **FULL** — non-reviewer + not owner → **404**. |
| **Live** | **PARTIAL** — **404** random id; **200** own report; **peer** report id **not** tested. |

**Overall:** **PARTIAL**.

---

## 4. Live positive worker flow (G4-style)

**PARTIAL** — no full create → upload → finalize → attach → submit chain; **submit-without-proof** incorrectly **succeeded** on production.

---

## 5. Live negative-path proof

| Path | Status |
|------|--------|
| Submit without proof → **400** | **OPEN** (prod wrong) |
| Unassigned task detail | **PARTIAL** (404 for random; not real unassigned id) |
| Cross-worker report read | **OPEN** (no second worker) |
| Lite task detail allowed | **OPEN** (prod 403 until deploy) |

**Overall:** **OPEN**.

---

## 6. Pilot smoke / release verification

| Class | Rationale |
|-------|-----------|
| **Executed** | **FULL** — `pilot_launch.sh` **PASS** with correct env sourcing. |
| **Documented curl pitfall** | **FULL** — `--location-trusted` required for Bearer on redirects. |

**Overall:** **FULL** for **smoke script**; **not** a substitute for worker proof gates.

---

## 7. Mobile runtime parity proof

**PARTIAL** — Android **compile** OK; **no** device run; production **lite** task path **blocked** until deploy.

---

## Priority backlog

| Priority | Item |
|----------|------|
| **P0** | **Deploy** web with `report.service` proof gate + `lite-allow-list` GET tasks/reports; **re-run** D1/D4 live. |
| **P0** | **Re-verify** submit-without-proof → **400** on production/preview. |
| **P1** | Second worker + shared report id for **cross-worker** read denial. |
| **P1** | Assigned task id for **task detail** positive path. |
| **P2** | `xcodebuild` Worker scheme CI evidence; Maestro against Preview. |

---

## Wave 3 closure (strict)

**Wave 3 is NOT CLOSED** for **live/operational** truth — **repo + tests** are ahead of **production behavior** for proof + lite paths.

**Wave 4 allowed:** **NO** (evidence-based — live closure criteria unmet).
