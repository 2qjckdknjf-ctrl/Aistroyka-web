# Wave 3 — Worker flow status

## Worker task access

- **List:** `GET /api/v1/worker/tasks/today` — unchanged; uses `listTasksForToday` + `createClientFromRequest` (Wave 1/2 aligned).
- **Detail:** `GET /api/v1/tasks/:id` — **fixed:** non-managers (workers) use **`getTaskForWorker`** — assignment checked via `validateTaskForReportLink`. Managers keep full `getTaskById`.

## Task detail (mobile)

- **iOS:** `TaskDetailView` still uses **`TaskDTO` from the list** (no regression). **`WorkerAPI.task(id:)`** added for optional refresh / parity.
- **Android:** Home/report flow unchanged; **`WorkerApi.task(taskId)`** added for parity.

## Report submission

- **Canonical path:** `POST /api/v1/worker/report/create` → upload session → finalize → `POST /api/v1/worker/report/add-media` → `POST /api/v1/worker/report/submit`.
- **Server truth:** Submit **fails with `proof_required` (HTTP 400)** if there is **no** linked media row. Matches **G9** (photo proof required); Android debug `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` cannot satisfy production acceptance alone.

## Photo proof

- **Enforced in** `submitReport` (domain), not only in mobile UI.
- **No** tri-state, **no** mandatory text comment (G9 deferred).

## Worker report status visibility

- **GET `/api/v1/reports/:id`:** Workers may read **only their own** report payload; managers/reviewers retain tenant read for review. Prevents cross-worker disclosure by ID guessing.
- **Sync/bootstrap** paths unchanged (Wave 1); still valid for offline-oriented state.

## iOS / Android implications

- **iOS:** Two-photo **before/after** UX remains product-level richness; **server** requires ≥1 attached media (Android single-photo flow qualifies).
- **Android:** Single photo pipeline satisfies **proof** if `add-media` completed before submit.

## Remaining Wave 4 dependencies

- Manager review surfaces (device + web parity), notifications as scoped in Wave 4 — **not started here**.
