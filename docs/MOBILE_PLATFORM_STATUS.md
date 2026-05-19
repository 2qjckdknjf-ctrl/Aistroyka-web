# Mobile Platform Status

**Clients:** web, ios_full, ios_lite, android_full, android_lite.

---

## 1. Worker Endpoints

| Endpoint | Status | Notes |
|----------|--------|--------|
| GET /api/v1/worker/tasks/today | **Ready** | Uses task.service; tenant-scoped. |
| POST /api/v1/worker/day/start, day/end | **Ready** | worker-day.service. |
| POST /api/v1/worker/report/create, add-media, submit | **Ready** | report service. |
| GET /api/v1/worker/sync | **Ready** | Lightweight delta (tasks, reports, sessions). |
| GET /api/v1/worker | **Ready** | Discovery: lists canonical subroutes (JSON). |
| POST /api/v1/worker | **N/A** | **405** — not an action endpoint; use subroutes. |

---

## 2. Sync Endpoints

| Endpoint | Status | Notes |
|----------|--------|--------|
| GET /api/v1/sync/bootstrap | **Ready** | Returns tasks, reports, uploadSessions, cursor; requires x-device-id. |
| GET /api/v1/sync/changes | **Ready** | change_log.service. |
| POST /api/v1/sync/ack | **Ready** | Cursor update. |
| Conflict 409 | **Contract** | Documented; implementation in changes/ack to be confirmed. |

---

## 3. Idempotency

| Aspect | Status |
|--------|--------|
| Table | **Present** (idempotency_keys migration). |
| Service | **Present** (idempotency.service). |
| x-idempotency-key on lite writes | **Mostly complete** — enforced on worker report/day paths, sync ack, media upload-sessions, **devices register/unregister**. Lite apps sign in via **Supabase SDK** (not `POST /api/v1/auth/login`); web login path is separate. |

**Recommendation:** If new lite-writable routes are added under the allow-list, attach `requireLiteIdempotency` + `storeLiteIdempotency` the same way as existing POST handlers.

---

## 4. Upload Session API

| Step | Status |
|------|--------|
| POST /api/v1/media/upload-sessions | **Ready** (create) |
| POST /api/v1/media/upload-sessions/[id]/finalize | **Ready** (finalize) |
| Client upload to storage (path from create) | **Assumed** client-side; finalize records object_path. |

---

## 5. Media Storage

- Upload path returned from create session; actual file upload to Supabase Storage is client-driven; finalize stores object_path and metadata.
- **Status:** Ready for mobile clients that implement create → upload → finalize flow.

---

## 6. Push Readiness

| Component | Status |
|-----------|--------|
| device_tokens, push_outbox | **Migrations present** (upload_push_devices). |
| POST /api/v1/devices/register, unregister | **Ready** |
| Android Worker | **FCM** — `WorkerFirebaseMessagingService` → `PushRegistrationService` + `registerIfNeeded`; replace placeholder `google-services.json` (see `docs/runbooks/PUSH_DELIVERY.md`). |
| iOS Worker | **Ready** — APNS token → Keychain; `registerIfNeeded` from AppDelegate / when logged in. |
| push.service | **Present** (APNS/FCM stubs). |
| Send path | **Stubbed** (docs: push send stubbed). |

---

## 7. Lite API Isolation

**Policy:** Clients sending **`x-client: ios_lite`** or **`android_lite`** may only hit an explicit allow-list; everything else under `/api/v1/*` gets **403** (`lite_client_path_forbidden`).

**Current (repo):** Implemented in Edge **`middleware.ts`** — for `/api/v1` requests it calls **`checkLiteAllowList`** (`apps/web/lib/api/lite-allow-list.ts`) before continuing. Covered by **`lite-allow-list.test.ts`**.

**Allowed surface (summary — see source for exact methods):**

- `GET /api/v1/projects` (tenant project list for worker app)
- `/api/v1/config`
- `/api/v1/worker/*`
- `/api/v1/sync/*`
- `/api/v1/media/upload-sessions*` (create + finalize)
- `/api/v1/devices/*`, `/api/v1/auth/*`
- `GET /api/v1/reports/:id/analysis-status`, `GET /api/v1/reports/:id` (read; writes not allow-listed)
- `GET /api/v1/tasks/:id` (read; PATCH forbidden at middleware)

**Not allow-listed (examples):** `POST /api/v1/projects`, `/api/v1/ai/*`, `/api/v1/admin/*`, billing/manager routes, etc. → **403** for lite.

**Gap:** **`x-idempotency-key`** is not required on every lite write at the route layer (see §3). Allow-list is path-only.

---

## 8. Headers

| Header | Status |
|--------|--------|
| x-client | **Parsed** (tenant context). |
| x-device-id | **Required** for bootstrap; used where needed. |
| x-idempotency-key | **Partial** — worker/sync/media/device token routes require key for `ios_lite` / `android_lite`; other endpoints may differ. |
| x-app-version, x-platform | **Documented**; not used in logic in reviewed code. |

---

## 9. CI — iOS UITest smoke

| Item | Status |
|------|--------|
| GitHub Actions | `.github/workflows/ios-ui-smoke.yml` — on **pull_request** (`ios/**` + workflow file; **skip** if diff is only `ios/**/*.md`), **`workflow_dispatch`** |
| Scope | Simulator-only login smoke (`pilot_*` accessibility ids); **Worker** + **Manager** schemes; no backend secrets required |
| Runbooks | `docs/runbooks/MOBILE_OFFLINE_QUEUE.md`, `docs/runbooks/MOBILE_SYNC.md` |

---

## 10. Summary

| Area | Status |
|------|--------|
| Worker endpoints | Ready |
| Sync endpoints | Ready |
| Idempotency | Service present; not enforced on all lite writes |
| Upload session API | Ready |
| Media storage flow | Ready (client upload + finalize) |
| Push (devices + outbox) | Tables and register/unregister ready; send stubbed |
| Lite allow-list | **Ready** — middleware + `lib/api/lite-allow-list.ts` (see §7) |
| iOS CI smoke | UITest on **Simulator** (see §9) |
