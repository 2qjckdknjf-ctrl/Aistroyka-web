# Phase 6.1 — Incident Readiness + Metrics + Expiration Scheduling

**Date:** 2026-03-06  
**Scope:** Upload session expiration scheduling, GET /api/v1/ops/metrics, rate-limit fail-open visibility, migration timestamp fix, incident runbooks.

---

## What changed

### Stage 1 — Upload session expiration scheduling

- **upload_reconcile handler** (`lib/platform/jobs/job.handlers/upload-reconcile.ts`):
  - Selects `id, tenant_id, user_id, created_at, expires_at` for sessions in `created`/`uploaded` with `expires_at` &lt; cutoff.
  - For each session marked expired, logs **upload_session_expired** (session_id, tenant_id, user_id, age_hours) via `logStructured`.
  - Then updates status to `expired` in batch (unchanged).
- **Schedule route:** **POST /api/v1/admin/jobs/schedule-reconcile**
  - Enqueues one **upload_reconcile** job per tenant (dedupe_key: `upload_reconcile`). Protected by cron secret when `REQUIRE_CRON_SECRET=true`.
  - Cron should call this route, then **POST /api/v1/jobs/process** to run the jobs.
- **Unit test:** `lib/platform/jobs/job.handlers/upload-reconcile.test.ts` — no expired sessions (no update, no log); expired sessions (update + two `upload_session_expired` logs).

### Stage 2 — GET /api/v1/ops/metrics

- **New endpoint:** **GET /api/v1/ops/metrics?from=&to=&project_id=**
  - Tenant-scoped (auth), read-only. Returns compact counts:
    - **uploads_stuck** — created/uploaded, created_at before 4h ago.
    - **uploads_expired** — status=expired, created_at in [from, to].
    - **devices_offline** — 0 (placeholder).
    - **sync_conflicts** — 0 (not stored in DB; use log aggregation).
    - **ai_failed** — AI job types, failed/dead, created_at in range.
    - **jobs_failed** — all jobs failed/dead in range.
    - **push_failed** — push_outbox status=failed, created_at in range.
- **Repository:** `lib/ops/ops-metrics.repository.ts` — `getOpsMetrics(supabase, tenantId, { from, to, project_id })` using count-only queries (head: true).
- **Tests:** `app/api/v1/ops/metrics/route.test.ts` — response shape, tenant passed to repo, from/to/project_id passed, 401 on tenant required error.

### Stage 3 — Rate limit fail-open visibility

- When **checkRateLimit** throws (e.g. table missing), routes now log **rate_limit_unavailable** with endpoint, tenant_id, request_id before allowing the request.
- **Touched routes:** sync ack, sync changes, upload-sessions finalize, jobs/process, ai/analyze-image, auth/login.

### Stage 4 — Migration timestamp ordering

- **Renamed:** `20260309600000_cockpit_indexes.sql` → **20260306235900_cockpit_indexes.sql** (content unchanged).
- Ensures migration order is correct and the file is not “from the future” relative to the project timeline. Index `idx_upload_sessions_tenant_status_created` still applies to `upload_sessions(tenant_id, status, created_at)`.

### Stage 5 — Incident runbooks

- **docs/runbooks/INCIDENT_SYNC_CONFLICTS.md** — Symptoms (409, sync_conflict logs), endpoints (sync/changes, ack, bootstrap), diagnostic SQL, actions (client recovery, retention, device_id), cockpit/metrics references.
- **docs/runbooks/INCIDENT_UPLOADS_STUCK.md** — Symptoms (stuck/expired in cockpit, metrics), endpoints (upload-sessions list/finalize, ops/metrics, ops/overview, schedule-reconcile, jobs/process), expiration and reconcile flow, diagnostic SQL, user guidance, cockpit pages.

---

## How to verify

1. **Unit tests**
   ```bash
   cd apps/web && npm test -- --run
   ```
   Expect 69 test files, 322 tests passing.

2. **CF build**
   ```bash
   cd apps/web && npm run cf:build
   ```
   Expect OpenNext build to complete and worker saved.

3. **Schedule reconcile (cron secret if enabled)**
   ```bash
   curl -X POST https://<host>/api/v1/admin/jobs/schedule-reconcile -H "x-cron-secret: <secret>"
   ```
   Expect `{ "ok": true, "enqueued": N, "tenants": N }`.

4. **Ops metrics**
   ```bash
   curl -H "Authorization: Bearer <token>" "https://<host>/api/v1/ops/metrics?from=2026-03-01&to=2026-03-06"
   ```
   Expect JSON with numeric fields: uploads_stuck, uploads_expired, devices_offline, sync_conflicts, ai_failed, jobs_failed, push_failed.

5. **Rate limit fail-open**
   - If rate_limit_slots table is missing or check fails, trigger a request to sync/ack or login and check logs for `event: "rate_limit_unavailable"`.

6. **E2E smoke**
   ```bash
   cd apps/web && npx playwright install && npm run test:e2e -- tests/e2e/cockpit-smoke.spec.ts
   ```
   Requires Playwright browsers installed; in CI the e2e job installs chromium and runs the same spec.

---

## Endpoints touched

| Endpoint | Change |
|----------|--------|
| POST /api/v1/admin/jobs/schedule-reconcile | New. Enqueue upload_reconcile per tenant. |
| GET /api/v1/ops/metrics | New. Lightweight counts. |
| POST /api/v1/sync/ack | Log rate_limit_unavailable on check failure. |
| GET /api/v1/sync/changes | Log rate_limit_unavailable on check failure. |
| POST /api/v1/media/upload-sessions/:id/finalize | Log rate_limit_unavailable on check failure. |
| POST /api/v1/jobs/process | Log rate_limit_unavailable on check failure. |
| POST /api/v1/ai/analyze-image (and legacy) | Log rate_limit_unavailable on check failure. |
| POST /api/auth/login | Log rate_limit_unavailable on check failure. |

---

## References

- MOBILE_SYNC.md, MOBILE_UPLOADS.md — Sync and upload flows.
- REPORT-PHASE6-PROD-HARDENING.md — Telemetry and request-id.
- INCIDENT_SYNC_CONFLICTS.md, INCIDENT_UPLOADS_STUCK.md — Incident runbooks.
