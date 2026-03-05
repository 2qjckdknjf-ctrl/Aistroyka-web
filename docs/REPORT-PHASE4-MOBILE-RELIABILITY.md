# Phase 4 — Mobile Reliability Hardening

**Project:** AISTROYKA.AI  
**Phase:** Offline-first sync, push delivery, background uploads, conflict resolution. No UI features.  
**Status:** Complete.

**Non-negotiables:** No v1 API contract breaks (worker/sync/media/devices); preserve Phase 1–3; mobile flows idempotent and retry-safe; prefer existing tables (device_tokens, push_outbox, sync_cursors, change_log, upload_sessions, worker_*).

---

## Stage 0 — Audit (done)

### 0.1 Endpoint inventory

| Endpoint | Method | Lite allowed | Idempotency (lite) |
| ---------- | -------- | -------------- | -------------------- |
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

### 0.3 Push modules (post–Stage 1–2)

- **lib/platform/push/**  
  - `push.service.ts`: `enqueuePush` inserts into `push_outbox` and enqueues `push_send` job (dedupe_key `push_drain`).  
  - Provider abstraction: `push.provider.types.ts`, `apns.provider.ts`, `fcm.provider.ts`, `push.provider.router.ts`.  
- **Tables:** `push_outbox` has `last_error`, `next_retry_at`; `device_tokens` has `disabled_at` (migration `20260309550000_push_outbox_drain.sql`).

### 0.4 Sync (post–Stage 3)

- **sync/cursors:** `getCursor`, `upsertCursor` by (tenant_id, user_id, device_id).  
- **sync/changes:** Returns 409 when `cursor > serverCursor` (deterministic body: `error`, `code: sync_conflict`, `serverCursor`, `must_bootstrap`, `hint`).  
- **sync/ack:** Same 409 contract when ack cursor ahead of server. See `lib/sync/sync-conflict.ts`, runbook `docs/runbooks/MOBILE_SYNC.md`.

### 0.5 Upload sessions (post–Stage 4)

- **create:** upload-session.service createUploadSession → repo.create, emitChange.  
- **finalize:** Session + tenant/user check; **object_path** must be within `media/<tenantId>/<sessionId>` (no `..`). Idempotent when already finalized with same path.  
- **upload_reconcile** job: marks `created`/`uploaded` sessions with expired `expires_at` as `expired`. Runbook `docs/runbooks/MOBILE_UPLOADS.md`.

---

## Stage 1 — Push provider abstraction (done)

- **Provider interface:** `PushProvider`, `PushSendParams`, `PushSendResult` (ok | { code: invalid_token | retryable | auth_error }).  
- **APNS:** `lib/platform/push/apns.provider.ts` — JWT (ES256), fetch to api.push.apple.com / api.sandbox. Env: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (or `APNS_KEY`), `APNS_BUNDLE_ID`, `APNS_ENV`.  
- **FCM:** `lib/platform/push/fcm.provider.ts` — legacy `FCM_SERVER_KEY`; when not set returns retryable.  
- **Token hygiene:** Handler sets `device_tokens.disabled_at` on `invalid_token`.  
- **Tests:** `apns.provider.test.ts`, `push.provider.test.ts`.

---

## Stage 2 — Push outbox draining (done)

- **Job type:** `push_send`. Handler `job.handlers/push-send.ts` drains `push_outbox` (queued, `next_retry_at` null or past), sends via provider, updates status (sent/failed) or retry with backoff (1m, 5m, 15m, 1h).  
- **Enqueue:** `enqueuePush` inserts outbox row and enqueues `push_send` (dedupe_key `push_drain`).  
- **Tests:** `job.handlers/push-send.test.ts` (no rows, no_tokens, invalid_token, retryable, success).

---

## Stage 3 — Sync conflicts (done)

- **409 contract:** `lib/sync/sync-conflict.ts` — body `{ error: "conflict", code: "sync_conflict", serverCursor, must_bootstrap, hint }`.  
- **Detection:** `cursor > getMaxCursor(tenantId)` on GET sync/changes and POST sync/ack returns 409.  
- **Runbook:** `docs/runbooks/MOBILE_SYNC.md` — on 409 → bootstrap, set cursor to serverCursor, retry.  
- **Tests:** `sync-conflict.test.ts`, `app/api/v1/sync/changes/route.test.ts`, `app/api/v1/sync/ack/route.test.ts`.

---

## Stage 4 — Upload reliability (done)

- **Finalize:** `upload-session.service` validates `object_path` prefix `media/<tenantId>/<sessionId>` (no `..`). Repo finalize is idempotent (already finalized with same path returns true).  
- **upload_reconcile job:** `job.handlers/upload-reconcile.ts` marks `created`/`uploaded` sessions with `expires_at` in the past as `expired` (batch 100).  
- **Runbook:** `docs/runbooks/MOBILE_UPLOADS.md`. **Tests:** `upload-session.service.test.ts`.

---

## Stage 5 — Mobile smoke scripts (done)

- **scripts/mobile/smoke-mobile.sh:** Health, config, bootstrap, create upload session, finalize (object_path = upload_path), create report, submit. Env: `BASE_URL`, `AUTH` (or `AUTH_HEADER`), `DEVICE_ID`, `IDEMPOTENCY_KEY` (optional).  
- **scripts/mobile/smoke-push.sh:** POST admin/push/test, POST jobs/process (with optional `CRON_SECRET`). Env: `BASE_URL`, `AUTH`, `CRON_SECRET` (if required).

---

## Stage 6 — Final report (done)

- Summary per stage above. Verification: `npm test -- --run`, `npm run cf:build`. `npm run build` may hit a known Next.js export 500.html rename issue in some environments; cf:build and tests are the gate.

---

## Files touched

- **Push:** `lib/platform/push/*.ts` (service, provider types, apns, fcm, router), `lib/platform/jobs/job.types.ts`, `job.service.ts`, `job.handlers/push-send.ts`, `push-send.test.ts`; migration `20260309550000_push_outbox_drain.sql`.  
- **Sync:** `lib/sync/sync-conflict.ts`, `sync-conflict.test.ts`; `app/api/v1/sync/changes/route.ts`, `ack/route.ts`; `changes/route.test.ts`, `ack/route.test.ts`.  
- **Upload:** `lib/domain/upload-session/upload-session.service.ts`, `upload-session.repository.ts`; `job.handlers/upload-reconcile.ts`; `upload-session.service.test.ts`.  
- **Runbooks:** `docs/runbooks/PUSH_DELIVERY.md`, `docs/runbooks/MOBILE_SYNC.md`, `docs/runbooks/MOBILE_UPLOADS.md`.  
- **Scripts:** `scripts/mobile/smoke-mobile.sh`, `scripts/mobile/smoke-push.sh`.

---

## Env vars (optional for push)

- **APNS:** `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (or `APNS_KEY`), `APNS_BUNDLE_ID`, `APNS_ENV=production|sandbox`.  
- **FCM:** `FCM_SERVER_KEY` (legacy).  
- **Jobs:** `CRON_SECRET` when `REQUIRE_CRON_SECRET` is true (for smoke-push and cron).

---

## How to run smoke scripts

```bash
# Mobile (sync + upload + report)
BASE_URL=https://your-api.example.com AUTH=<bearer-token> ./scripts/mobile/smoke-mobile.sh

# Push (admin + jobs/process)
BASE_URL=https://your-api.example.com AUTH=<admin-bearer> CRON_SECRET=<secret> ./scripts/mobile/smoke-push.sh
```

---

## Known follow-ups (Phase 5+)

- Dashboard/UI for outbox status (optional admin outbox list endpoint).  
- FCM HTTP v1 (service account) for production Android.  
- Storage HEAD check in finalize (optional).
