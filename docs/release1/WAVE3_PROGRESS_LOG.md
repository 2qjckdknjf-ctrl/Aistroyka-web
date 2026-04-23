# Wave 3 — Progress log (append-only)

## 2026-03-28 (closure sprint)

- **Live:** `pilot_launch.sh` **PASS** on `https://aistroyka.ai` with dual `.env.local` sourcing.
- **Live:** `POST /worker/report/submit` **without** media → **HTTP 200** on production — **deploy drift** vs repo proof gate.
- **Live:** `GET /api/v1/tasks/:id` + `ios_lite` → **403** `lite_client_path_forbidden` until `lite-allow-list` deploy.
- **Curl:** Bearer + apex/www redirect requires **`--location-trusted`** (401 without).
- **Code:** `lite-allow-list.ts` — allow **GET** `/api/v1/tasks/:id` and `/api/v1/reports/:id` for lite clients (RBAC in routes).
- **Android:** Removed duplicate `TaskDetailResponse` from `WorkerDtos.kt`; `WorkerApi.task` returns `TaskDetailDto`.
- **Docs:** `WAVE3_LIVE_*`, `WAVE3_PILOT_SMOKE_REPORT`, `WAVE3_FINAL_POST_AUDIT_REPORT`, `WAVE3_TRUE_CLOSURE_SUMMARY`, `WAVE3_MOBILE_RUNTIME_REPORT`, `WAVE3_LIVE_VALIDATION_REPORT`.
- **Verdict:** **Wave 3 not live-closed** — deploy + re-verify required.

## 2026-03-28

- **Inspection:** Read `PHASE1_FINAL_SCOPE.md`, `PHASE1_EXECUTION_WAVES.md`, `PHASE1_EXCLUDES.md`, `G9_PRODUCT_DECISION_APPROVED.md`, `WAVE2_FINAL_STATUS.md`, `PHASE1_ACCEPTANCE_GATES.md`.
- **Finding:** `submitReport` did not require media rows (G9 photo proof gap).
- **Finding:** `GET /api/v1/tasks/:id` used manager-only `getTaskById` (workers 403).
- **Finding:** `GET /api/v1/reports/:id` allowed any tenant user to read any report in tenant.
- **Commands:** `npx vitest run` (apps/web) — **1116 passed / 182 files**.
- **Changes:** Implemented proof gate, `getTaskForWorker`, report GET scoping, mobile `task()` helpers; tests added.
- **Blockers:** None.
- **Decision:** Do **not** implement G9-deferred text comment or tri-state; photo proof enforced server-side only.
