# Phase 6 — Production Hardening + Observability + Release Gates

**Date:** 2026-03-06  
**Scope:** apps/web — request id, structured logging, job/AI/sync/upload telemetry, CI gates, security/perf pass.

---

## Baseline (Stage 0)

**Logging:** `lib/observability/logger.ts` — `logStructured(payload)` writes JSON to console (event, traceId, tenantId, userId, route, status, duration_ms, error_type). Skipped in test env. No PII.

**Request ID:** `lib/observability/trace.ts` — `getOrCreateTraceId(request)` reads `x-request-id` or generates UUID. Used in tenant context as `traceId`. Not set on API responses; no middleware injection for API.

**Job processing:** `app/api/analysis/process/route.ts` uses getOrCreateTraceId + logStructured. `lib/ai/runOneJob.ts` has console.log; optional traceId in job logs.

**AI logs:** `lib/platform/ai/ai.service.ts` and providers use console.log; policy/audit in `ai_policy_decisions`.

**Cockpit overview:** `DashboardOpsOverviewClient` → GET `/api/v1/ops/overview` → `lib/ops/ops-overview.repository.ts` `getOpsOverview()` (Supabase: projects, worker_day, worker_reports, upload_sessions, jobs, push_outbox).

---

## Stage 1 — Request ID + Structured Logging

**Added:**
- **Request ID:** `getOrCreateRequestId(request)` and `addRequestIdToResponse(response, requestId)` in `lib/observability/trace.ts`. All responses from wrapped routes set `x-request-id` (echoed if client sent it).
- **Structured logger:** `lib/observability/logger.ts` extended with `request_id`, `method`, `error_code`, `component`; `logInfo`, `logWarn`, `logError`; sanitization so no secrets (token, password, etc.) are logged.
- **Request timing:** `lib/observability/request-timing.ts` — `withRequestIdAndTiming(request, response, { route, method, duration_ms, tenantId, userId })` sets header and logs `request_finished`.

**Endpoints wrapped (request_id + timing):**
- `POST /api/v1/sync/ack`
- `GET /api/v1/sync/changes`
- `GET /api/v1/media/upload-sessions`, `POST /api/v1/media/upload-sessions`
- `POST /api/v1/media/upload-sessions/:id/finalize`
- `GET /api/v1/ops/overview`
- `POST /api/analysis/process`
- `POST /api/v1/jobs/process`
- `POST /api/v1/ai/analyze-image` (via `app/api/ai/analyze-image/route.ts`)

**Tests:** `lib/observability/trace.test.ts` (getOrCreateTraceId, addRequestIdToResponse); `app/api/v1/sync/ack/route.test.ts` asserts `x-request-id` present and echoed when provided.

---

## Stage 2 — Job Telemetry

**Added:**
- **Enqueue:** `lib/platform/jobs/job.service.ts` — after `repo.enqueue` + emit, logs `job_enqueued` (job_id, job_type, tenant_id, request_id).
- **Run lifecycle:** In `processJobs`, logs `job_started` (job_id, job_type, tenant_id, attempts, request_id); on success `job_succeeded` (duration_ms, attempts); on failure `job_failed` (attempts, duration_ms, retryable, next_retry_at, error_code).
- **Analysis job (runOneJob):** `lib/ai/runOneJob.ts` — `job_started`, `job_succeeded`, `job_failed` with stable `error_code` (timeout, ai_failure, validation_error, etc.).

**Tests:** Existing job.service and runOneJob tests pass; no new mocks (logger no-op in test).

---

## Stage 3 — AI Telemetry

**Added:**
- **Success:** `lib/platform/ai/ai.service.ts` — `logAiRequest` (replacing console log) with event `ai_request`, fields: provider, model, tier, latency_ms, tokens_in, tokens_out, estimated_cost, policy_decision_id, result_status (success), tenant_id, user_id, request_id.
- **Failure (route):** `app/api/ai/analyze-image/route.ts` — failure log includes `error_code` (ai_policy_denied, timeout, ai_failure, unknown) and `provider_error_type` (auth, retryable, invalid_request). Uses `logStructured` for `ai_analyze_image` event.

**Cockpit AI list/detail:** Existing GET `/api/v1/ai/requests` and `.../ [id]` return job fields (last_error_type as stable code); no secrets. No schema change.

---

## Stage 4 — Sync/Upload Telemetry

**Added:**
- **Sync conflict:** In `POST /api/v1/sync/ack` and `GET /api/v1/sync/changes`, when returning 409, log `sync_conflict` (hint: retention_window_exceeded | cursor_ahead | device_mismatch, device_id, tenant_id, user_id, request_id).
- **Bootstrap:** In `GET /api/v1/sync/bootstrap`, after success log `sync_bootstrap` (tasks_count, reports_count, upload_sessions_count, cursor, tenant_id, user_id, device_id).
- **Upload sessions:** In `lib/domain/upload-session/upload-session.service.ts` — `upload_session_created` (session_id, tenant_id, user_id, purpose); `upload_session_finalized` (session_id, tenant_id, user_id).
- **Stuck (overview only):** In `lib/ops/ops-overview.repository.ts`, when `stuck_uploads_count > 0`, log `ops_overview_stuck_calculation` (tenant_id, stuck_uploads_count). No per-session spam.

**Optional metrics endpoint:** Not added; overview already aggregates. Can add GET `/api/v1/ops/metrics` later if needed.

---

## Stage 5 — Release Gates (CI)

**Added:**
- **Scripts:** `npm test -- --run` (vitest) and `npm run cf:build` already in use; confirmed.
- **Playwright smoke:** `tests/e2e/cockpit-smoke.spec.ts` — overview loads; navigate uploads/devices/AI (table or empty); admin page blocked or redirect for non-admin (new test).
- **CI:** `apps/web/.github/workflows/ci.yml` — job `check` (lint, test, cf:build) unchanged; new job `e2e` (needs: check): install deps, install Playwright chromium, start dev server in background, wait for http://127.0.0.1:3000, run `npm run test:e2e -- tests/e2e/cockpit-smoke.spec.ts`.

---

## Stage 6 — Security/Perf Quick Pass

**Devices:** Verified GET `/api/v1/devices` — list uses `DEVICE_LIST_COLS` without token columns; response mapping explicitly omits token/fcm_token/apns_token. No raw push token to non-admin.

**Rate limiting:** Added `checkRateLimit(admin, { tenantId, ip, endpoint })` (best-effort; allow on failure) on:
- `POST /api/v1/sync/ack`
- `GET /api/v1/sync/changes`
- `POST /api/v1/media/upload-sessions/:id/finalize`  
AI analyze and jobs/process already had rate limiting.

**Indexes:** New migration `20260309600000_cockpit_indexes.sql` — `idx_upload_sessions_tenant_status_created` on `upload_sessions(tenant_id, status, created_at)` for cockpit list/stuck queries. Jobs already had `idx_jobs_tenant_created`.

---

## Verification

**Request ID on responses:**
```bash
curl -sI -X POST https://<host>/api/v1/sync/ack -H "x-device-id: d1" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"cursor":0}'
# Expect header: x-request-id: <uuid or echoed value>
```

**Run tests and cf:build:**
```bash
cd apps/web
npm test -- --run
npm run cf:build
```

**E2E smoke (local, with dev server):**
```bash
cd apps/web
npm run dev   # in another terminal
npm run test:e2e -- tests/e2e/cockpit-smoke.spec.ts
```

**CI:** Push to a branch that triggers CI; ensure both `check` and `e2e` jobs pass.

---

## Known Follow-ups (Phase 7+)

- **Worker app rollout:** Phase 7 may introduce a separate worker process; job telemetry and runOneJob patterns are ready.
- **GET /api/v1/ops/metrics:** Omitted for now; add if cockpit needs aggregated counts without loading full overview.
- **Upload session expired:** No cron/job for marking expired sessions yet; `upload_session_expired` log not added.
- **E2E in CI:** Depends on dev server start and Playwright browsers; if flaky, consider running e2e against a preview deployment instead.
