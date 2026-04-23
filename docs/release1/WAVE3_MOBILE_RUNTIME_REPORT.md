# Wave 3 — Mobile runtime report

**Date:** 2026-03-28

---

## E1 — Target

- **iOS Worker / Android Worker** against **live** host: **not** executed on physical devices or simulators in this session.

---

## E2 — Live `GET /api/v1/tasks/:id` as lite client

| Observation | Detail |
|---------------|--------|
| **Production** with `x-client: ios_lite` | **HTTP 403** `lite_client_path_forbidden` for `GET /api/v1/tasks/:id` (see negative path report). |
| **Repo fix** | `GET` `tasks/:id` and `reports/:id` added to **`lite-allow-list.ts`** — **requires deploy** before mobile parity works at runtime. |

---

## E3 — Build / compile substitute

| Artifact | Result |
|----------|--------|
| **Android** `:shared:compileDebugKotlin` | **PASS** after resolving `TaskDetailResponse` duplicate (Worker uses **`TaskDetailDto`** / `TaskDetailResponse` from `ManagerDtos.kt`). |
| **iOS** | **Not compiled** in this session (no `xcodebuild` run). |

---

## Manual procedure (post-deploy)

1. Point app to `BASE_URL` (or Preview URL) with valid Supabase session.
2. Call **`WorkerAPI.task(id:)`** / **`WorkerApi.task`** — expect **200** when assigned, **403/404** when not.
3. Confirm **`x-client`**: `ios_lite` / `android_lite`.

---

## Blockers

- **No device/simulator** run in this environment.
- **Production** still returns **403** for lite task detail until allow-list deploy.

---

**Status:** **PARTIAL** — wiring + Android compile; **no** full device runtime proof.
