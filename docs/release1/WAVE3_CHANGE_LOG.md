# Wave 3 — Change log

| File | Type | Reason |
|------|------|--------|
| `apps/web/lib/domain/reports/report.service.ts` | Code | Enforce **photo proof** (≥1 `worker_report_media` row with `media_id` or `upload_session_id`) before submit; reuse the same media list for post-submit job enqueue. |
| `apps/web/app/api/v1/worker/report/submit/route.ts` | Code | Map `proof_required` to **HTTP 400**; keep `task_invalid` → 404, other failures → 403. |
| `apps/web/lib/domain/tasks/task.service.ts` | Code | Add `getTaskForWorker`: **viewer+** may read task detail only when the task is assigned to them (`validateTaskForReportLink`). |
| `apps/web/app/api/v1/tasks/[id]/route.ts` | Code | **GET**: managers use `getTaskById`; non-managers use `getTaskForWorker` so workers are not blocked by manager-only RBAC. |
| `apps/web/app/api/v1/reports/[id]/route.ts` | Code | **GET**: non-reviewers may only read reports where **`report.user_id === ctx.userId`** (404 otherwise) — closes cross-worker read within tenant. |
| `apps/web/lib/domain/reports/report.service.task-link.test.ts` | Test | Cover `proof_required` when media list is empty. |
| `apps/web/lib/domain/tasks/task.service.test.ts` | Test | Cover `getTaskForWorker` (rights, assignment, success). |
| `ios/Shared/Sources/Shared/Endpoints.swift` | Code | `TaskDetailResponse` for `GET /api/v1/tasks/:id`. |
| `ios/AiStroykaWorker/.../WorkerAPI.swift` | Code | `task(id:)` calling tasks detail endpoint. |
| `android/shared/.../WorkerDtos.kt` | Code | `TaskDetailResponse` DTO. |
| `android/shared/.../WorkerApi.kt` | Code | `task(taskId)` helper. |
| `docs/release1/WAVE3_*.md` | Docs | Wave 3 plan, log, test results, worker flow status, final status, progress log. |

**Closure sprint (2026-03-28) — additional**

| File | Type | Reason |
|------|------|--------|
| `apps/web/lib/api/lite-allow-list.ts` | Code | Allow **GET** `/api/v1/tasks/:id` and **GET** `/api/v1/reports/:id` for `ios_lite`/`android_lite` (RBAC in route handlers); fixes middleware **403** blocking Worker mobile task/report reads. |
| `apps/web/lib/api/lite-allow-list.test.ts` | Test | Updated expectations for lite GET tasks/reports vs PATCH. |
| `android/shared/.../WorkerDtos.kt` | Code | Removed duplicate `TaskDetailResponse` (conflicted with `ManagerDtos.kt`). |
| `android/shared/.../WorkerApi.kt` | Code | `task()` returns `TaskDetailDto` via existing `TaskDetailResponse`. |
| `scripts/smoke/pilot_launch.sh` | Docs | Comment: use `--location-trusted` for Bearer on any `BASE_URL` that may redirect. |
| `docs/release1/WAVE3_*LIVE*`, `WAVE3_*POST_AUDIT*`, `WAVE3_TRUE_CLOSURE*` | Docs | Live verification, pilot smoke, strict post-audit, true closure summary. |

**Not changed:** `tenant/**`, Stripe webhook, upload-session core semantics.
