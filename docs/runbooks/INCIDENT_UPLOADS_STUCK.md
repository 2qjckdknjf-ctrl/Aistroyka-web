# Incident Runbook: Uploads Stuck / Expiration

When sessions stay in `created` or `uploaded` and never finalize, or users report "upload expired" / "session not found".

## Symptoms

- Cockpit **Uploads** list shows sessions in "created" or "uploaded" for hours.
- **GET /api/v1/ops/metrics** shows `uploads_stuck` > 0 or `uploads_expired` > 0.
- Ops overview shows **Stuck uploads** queue.
- Logs show `event: "upload_session_expired"` (session_id, tenant_id, user_id, age_hours) or `event: "ops_overview_stuck_calculation"`.

## Endpoints

| Action | Endpoint | Notes |
|--------|----------|--------|
| List sessions | **GET** `/api/v1/media/upload-sessions?stuck=1&stuck_hours=4` | Tenant-scoped; manager/cockpit. |
| Create session | **POST** `/api/v1/media/upload-sessions` | Body `{ "purpose": "project_media" }`. |
| Finalize | **POST** `/api/v1/media/upload-sessions/:id/finalize` | Body `{ "object_path", "mime_type?", "size_bytes?" }`. |
| Lightweight metrics | **GET** `/api/v1/ops/metrics?from=&to=` | Returns `uploads_stuck`, `uploads_expired`. |
| Ops overview | **GET** `/api/v1/ops/overview` | KPIs + queues including stuck uploads. |

## Expiration and reconciliation

- Sessions have **expires_at**. After that, finalize will reject (session expired).
- **upload_reconcile** job marks `created`/`uploaded` sessions with `expires_at` in the past as **expired**. No storage delete.
- **Recommended:** Call **POST /api/v1/admin/jobs/cron-tick** (cron secret when `REQUIRE_CRON_SECRET=true`). This single endpoint (1) enqueues one `upload_reconcile` per tenant (tenant-scoped dedupe) and (2) runs job processing. Response: `{ ok, scheduled, processed, tenants }`.
- **Alternative:** **POST /api/v1/admin/jobs/schedule-reconcile** then **POST /api/v1/jobs/process** (two-step). One `upload_reconcile` job per tenant (dedupe_key `upload_reconcile:<tenantId>`).

## Diagnostic queries (Supabase / SQL)

- **Stuck (created/uploaded, old):**  
  `SELECT id, tenant_id, user_id, status, created_at, expires_at FROM upload_sessions WHERE tenant_id = '<id>' AND status IN ('created','uploaded') AND created_at < NOW() - INTERVAL '4 hours';`
- **Expired count in range:**  
  `SELECT COUNT(*) FROM upload_sessions WHERE tenant_id = '<id>' AND status = 'expired' AND created_at BETWEEN :from AND :to;`

## Actions

1. **Confirm stuck count**  
   Call **GET /api/v1/ops/metrics?from=&to=** (tenant-scoped). Check `uploads_stuck` and `uploads_expired`.

2. **Ensure reconcile is running**  
   - Cron (or scheduler) should call **POST /api/v1/admin/jobs/cron-tick** (with `x-cron-secret` if `REQUIRE_CRON_SECRET=true`). Alternatively: **POST /api/v1/admin/jobs/schedule-reconcile** then **POST /api/v1/jobs/process**.  
   - Check job queue: **GET /api/v1/admin/jobs?status=failed** (admin). Look for `upload_reconcile` failures.

3. **User guidance**  
   - If a session is **expired**: client must create a **new** session (**POST /api/v1/media/upload-sessions**) and re-upload; do not retry finalize on the same session.  
   - If session is **stuck** (still created/uploaded but old): client can retry finalize if within expiry; otherwise create new session and re-upload.

4. **No manual DB fix required**  
   - Reconcile job updates status to `expired` in batch. No need to manually update rows unless debugging.

## Cockpit pages

- **Dashboard (ops overview):** `/[locale]/dashboard` — KPIs and "Stuck uploads" queue.
- **Uploads list (manager):** `/[locale]/dashboard/uploads` — Filter by status, optional `stuck=1` (uses API with `stuck_hours`).
- **Admin jobs:** `/[locale]/admin/jobs` — List/filter jobs; confirm `upload_reconcile` runs.

## References

- **MOBILE_UPLOADS.md** — Create → upload binary → finalize flow, retry rules, expiration.
- **REPORT-PHASE6-PROD-HARDENING.md** — `upload_session_created` / `upload_session_finalized` / `upload_session_expired` telemetry.
- **REPORT-PHASE6-1-INCIDENT-METRICS.md** — Schedule-reconcile route, GET /api/v1/ops/metrics.
