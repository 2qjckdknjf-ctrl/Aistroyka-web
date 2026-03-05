# Mobile Platform Status

**Clients:** web, ios_full, ios_lite, android_full, android_lite.

---

## 1. Worker Endpoints

| Endpoint | Status | Notes |
|----------|--------|--------|
| GET /api/v1/worker/tasks/today | **Ready** | Uses task.service; tenant-scoped. |
| POST /api/v1/worker/day/start, day/end | **Ready** | worker-day.service. |
| POST /api/v1/worker/report/create, add-media, submit | **Ready** | report service. |
| POST /api/v1/worker/sync | **Ready** | Sync path. |
| GET/POST /api/v1/worker | **Stub** | 501. |

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
| x-idempotency-key on lite writes | **Not enforced** in route layer for all worker/sync/media writes. |

**Recommendation:** Require x-idempotency-key for POSTs from lite clients and use idempotency.service in upload-sessions, worker report create/add-media/submit, sync ack.

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
| push.service | **Present** (APNS/FCM stubs). |
| Send path | **Stubbed** (docs: push send stubbed). |

---

## 7. Lite API Isolation

**Required (guardrails):** Lite may only access worker/*, sync/*, media/upload-sessions*, reports/*/analysis-status, config, devices/*, auth/*. Forbidden: admin, billing, org, analytics, projects, export, security, jobs/process, ai/*.

**Current:** x-client parsed in tenant context; **no middleware or guard** that rejects lite requests to forbidden paths. A lite client could call /api/v1/projects or /api/v1/ai/analyze-image and would be allowed if authenticated.

**Recommendation:** Add middleware (or per-route check) that, when x-client is ios_lite or android_lite, returns 403 for any path not in the allowed list.

---

## 8. Headers

| Header | Status |
|--------|--------|
| x-client | **Parsed** (tenant context). |
| x-device-id | **Required** for bootstrap; used where needed. |
| x-idempotency-key | **Not enforced** on all lite write endpoints. |
| x-app-version, x-platform | **Documented**; not used in logic in reviewed code. |

---

## 9. Summary

| Area | Status |
|------|--------|
| Worker endpoints | Ready |
| Sync endpoints | Ready |
| Idempotency | Service present; not enforced on all lite writes |
| Upload session API | Ready |
| Media storage flow | Ready (client upload + finalize) |
| Push (devices + outbox) | Tables and register/unregister ready; send stubbed |
| Lite allow-list | Not implemented |
