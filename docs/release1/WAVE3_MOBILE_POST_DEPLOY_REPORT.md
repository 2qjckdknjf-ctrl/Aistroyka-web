# Wave 3 — Mobile post-deploy report

**Date:** 2026-03-28

---

## F1. Lite paths after deploy

| Behavior | Pre-deploy (`sha7=3d329d3`) | Post-deploy (`8ea1603` expected) |
|----------|-----------------------------|----------------------------------|
| `GET /tasks/:id` + `ios_lite` | **403** `lite_client_path_forbidden` | **Should** reach route → **404** for bogus id (middleware allows GET). |
| `GET /reports/:id` + `ios_lite` | **403** | **Should** reach route → **404** / **200** per RBAC. |

**Verified post-deploy:** **No** — production stamp did not update in session.

---

## F2. Client-side consumption

**Not** run on device/emulator in this session.

---

## F3. Substitute evidence

| Item | Evidence |
|------|----------|
| **Android** | `:shared:compileDebugKotlin` passed in prior closure (Worker `task()` uses `TaskDetailDto`). |
| **iOS** | `WorkerAPI.task` + `TaskDetailResponse` in repo; **no** `xcodebuild` in this sprint. |

---

**Status:** **PARTIAL** — **pending** production deploy + optional device smoke.
