# Phase 4 — Mobile Reliability Hardening

**Project:** AISTROYKA.AI  
**Phase:** Offline-first sync, push delivery, background uploads, conflict resolution. No UI features.  
**Status:** In progress.

**Non-negotiables:** No v1 API contract breaks (worker/sync/media/devices); preserve Phase 1–3; mobile flows idempotent and retry-safe; prefer existing tables (device_tokens, push_outbox, sync_cursors, change_log, upload_sessions, worker_*).

---

## Stage 0 — Audit (done)

### 0.1 Endpoint inventory

| Endpoint | Method | Lite allowed | Idempotency (lite) |
|----------|--------|--------------|--------------------|
| /api/v1/devices/register | POST | ✓ | — |
| /api/v1/devices/unregister | POST | ✓ | — |
| /api/v1/worker/tasks/today | GET | ✓ | — |
| /api/v1/worker/day/start | POST | ✓ | ✓ |
| /api/v1/worker/day/end | POST | ✓ | ✓ |
| /api/v1/worker/report/create | POST | ✓ | ✓ |
| /api/v1/worker/report/add-media | POST | ✓ | ✓ |
| /api/v1/worker/report/submit | POST | ✓ | ✓ |
| /api/v1/worker/sync | GET | ✓ | — |
| /api/v1/sync/bootstrap | GET | ✓ | — |
| /api/v1/sync/changes | GET | ✓ | — |
| /api/v1/sync/ack | POST | ✓ | ✓ |
| /api/v1/media/upload-sessions | POST | ✓ | ✓ |
| /api/v1/media/upload-sessions/[id]/finalize | POST | ✓ | ✓ |

### 0.2 Lite allow-list and idempotency

- **Allow-list:** `lib/api/lite-allow-list.ts` allows /api/v1/config, worker/*, sync/*, media/upload-sessions*, devices/*, auth*, reports/:id/analysis-status. Enforced in middleware for x-client ios_lite/android_lite.
- **Idempotency:** Lite write endpoints use `requireLiteIdempotency` / `storeLiteIdempotency` (upload-sessions create/finalize, worker day/start, day/end, report/create, add-media, submit, sync/ack).

### 0.3 Push modules

- **lib/platform/push/**  
  - `push.service.ts`: `enqueuePush(supabase, { tenantId, userId, platform, type, payload })` → insert into `push_outbox` (status `queued`). Used by admin push/test with **admin** client (RLS on push_outbox has insert with check(false), so only service role can insert).  
  - `push.types.ts`: PushPlatform, PushMessageType, PushOutboxRow.  
  - `apns.stub.ts`: `isApnsConfigured()` (APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID), `sendApns()` returns false.  
  - `fcm.stub.ts`: `isFcmConfigured()` (FCM_SERVER_KEY or GOOGLE_APPLICATION_CREDENTIALS), `sendFcm()` returns false.  
- **Tables:** `push_outbox` (id, tenant_id, user_id, platform, type, payload, status queued|sent|failed, attempts, created_at). No `last_error` or `next_retry_at` yet. `device_tokens` (tenant_id, user_id, device_id, platform, token).

### 0.4 Sync

- **sync/cursors:** `getCursor`, `upsertCursor` by (tenant_id, user_id, device_id). No conflict check: ack always overwrites cursor.  
- **sync/changes:** `getChangesAfter(tenantId, cursor, limit)`; returns nextCursor = last change id. No 409 on stale cursor.  
- **Conflict contract:** Not yet defined; to add in Stage 3 (409 body with serverCursor, must_bootstrap).

### 0.5 Upload sessions

- **create:** upload-session.service createUploadSession → repo.create, emitChange.  
- **finalize:** finalizeUploadSession checks session exists, tenant/user, then repo.finalize. No object_path prefix validation or reconciliation job yet.

---

## Stage 1 — Push provider abstraction (placeholder)

- _Provider interface: send({ platform, token, title?, body?, data?, ... }) → result; errors invalid_token, retryable, auth_error._
- _APNS: HTTP/2 or HTTP-based with JWT; env APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY/P8, APNS_BUNDLE_ID, APNS_ENV._
- _FCM: HTTP v1 or placeholder; env FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY._
- _Token hygiene: mark device_tokens disabled on invalid_token._
- _Tests: provider shaping, push.service + mock provider._

---

## Stage 2 — Push outbox draining (placeholder)

- _Job type push_send; handler claims outbox rows, send via provider, update status (sent/failed), backoff, dedupe._
- _Optional admin outbox endpoint._
- _Tests: status transitions, invalid token, retryable._

---

## Stage 3 — Sync conflicts (placeholder)

- _409 contract: { error: "conflict", code: "sync_conflict", serverCursor, must_bootstrap? }._
- _Conflict detection on changes/ack (stale cursor, device mismatch)._
- _MOBILE_SYNC runbook: on 409 → bootstrap, reset cursor, retry._

---

## Stage 4 — Upload reliability (placeholder)

- _Finalize: tenant/user, status pending→finalized, object_path prefix validation._
- _upload-reconcile job: expire old pending sessions._
- _MOBILE_UPLOADS runbook; tests._

---

## Stage 5 — Mobile smoke scripts (placeholder)

- _scripts/mobile/smoke-mobile.sh, smoke-push.sh; BASE_URL, AUTH._

---

## Stage 6 — Final report (placeholder)

- _Summary, files touched, env vars, smoke usage, follow-ups._

---

## Files touched (to be filled)

- _Per stage._

---

## How to verify (to be filled)

- _Unit tests, build, cf:build, smoke commands._
