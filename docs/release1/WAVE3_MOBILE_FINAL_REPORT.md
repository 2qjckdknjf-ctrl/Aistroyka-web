# Wave 3 — Mobile final report

**Date:** 2026-03-28 (UTC)

---

## G1. Lite paths after “deploy” (actual runtime)

| Check | Result on current production |
|-------|------------------------------|
| `GET /api/v1/tasks/:id` + `ios_lite` | **403** `lite_client_path_forbidden` |
| `GET /api/v1/reports/:id` + `ios_lite` | **403** `lite_client_path_forbidden` |

**Interpretation:** Middleware still **pre–Wave 3** — **not** repo `8ea16034` behavior.

---

## G2. Device / emulator

**Not run** in this session.

---

## G3. Substitute evidence (repo)

| Item | Evidence |
|------|----------|
| **Lite allow-list** | `apps/web/lib/api/lite-allow-list.ts` allows GET `tasks/:id` and `reports/:id` for lite |
| **Android** | `WorkerApi.task` + `TaskDetailDto` compile path (prior session) |
| **iOS** | `WorkerAPI.task` + `TaskDetailResponse` in repo |

---

## G4. Post-alignment manual steps

1. Confirm **`health`** shows Wave 3 SHA.
2. Curl: `GET .../tasks/<uuid>` + `x-client: ios_lite` → expect **404**, not **403**.
3. Optional: run **AiStroykaWorker** against `aistroyka.ai`.

---

**Status:** **OPEN** on live mobile/lite behavior until production deploy.
