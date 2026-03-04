# Phase 2 — Async Pipeline + Observability + Mobile Offline Readiness

**Project:** AISTROYKA.AI  
**Completed:** Phase 2.1–2.8

---

## 1. Job system design + schema

- **Tables:** `jobs` (id, tenant_id, user_id, type, payload, status, attempts, max_attempts, run_after, locked_by, locked_at, last_error, last_error_type, trace_id, created_at, updated_at), `job_events` (id, job_id, ts, event, details).
- **Types:** ai_analyze_media, ai_analyze_report. Status: queued → running → success | failed | dead.
- **Handlers:** ai_analyze_media resolves image URL (payload or media/upload_sessions), calls runVisionAnalysis, records usage. ai_analyze_report no-op (sentinel for pipeline).

## 2. Locking strategy (atomic claim)

- **RPC:** `claim_jobs(p_worker_id, p_limit, p_tenant_id)` in migration 20260305000000_jobs.sql. Uses `SELECT ... FOR UPDATE SKIP LOCKED` and `UPDATE jobs SET status='running', locked_by=..., attempts=attempts+1` in one transaction. Returns claimed rows.

## 3. Backoff and dead-letter

- **Backoff:** nextRunAfter(attempt) = min(attempt * 2000ms, 600_000ms). On failure we call markFailedForRetry (status back to queued, run_after set).
- **Dead-letter:** After max_attempts or non-retryable (e.g. JobPayloadError) we mark status=dead and emit event dead.

## 4. Integration (worker submit → jobs → analysis)

- On POST /api/v1/worker/report/submit we submit the report then enqueue one ai_analyze_report and N ai_analyze_media (from worker_report_media). Response: reportId, jobIds, status: "queued".
- GET /api/v1/reports/:id/analysis-status returns queued|running|success|failed and summary (mediaTotal, analyzed, failed).
- POST /api/v1/jobs/process (admin) claims and runs jobs with time budget (25s default).

## 5. Idempotency model

- **Header:** x-idempotency-key. Table idempotency_keys (key pk, tenant_id, user_id, route, response jsonb, status_code, expires_at). TTL 24h.
- **Applied to:** report submit, upload-session finalize. Same key returns same stored response.

## 6. Observability + admin surfaces

- **tenant_daily_metrics** table (tenant_id, date, ai_calls, ai_cost_usd, jobs_processed, jobs_failed, uploads, active_workers). RLS for owner/admin.
- **Admin endpoints:** GET /api/v1/admin/metrics/overview?range=30d, GET /api/v1/admin/ai/usage?range=30d, GET /api/v1/admin/jobs?status=failed. All require admin:read (owner/admin). AI usage reads from ai_usage when tenant_daily_metrics not populated.

## 7. Mobile offline readiness

- **Sync:** GET /api/v1/worker/sync?since=<timestamp> returns serverTime, traceId, data: { tasks, reports, uploadSessions } (delta when since provided). Pagination token reserved for future.
- **Idempotency:** All write endpoints that matter (report submit, upload finalize) accept x-idempotency-key; responses include traceId where applicable (e.g. sync returns serverTime + traceId).

## 8. Risks + Phase 3 roadmap

**Risks:** tenant_daily_metrics not yet written by processor (admin reads from ai_usage/jobs); idempotency key per operation (same key for different report_ids returns first response).  
**Phase 3:** Backfill or write tenant_daily_metrics from job processor / ai_usage; cron or Cloudflare scheduled trigger for jobs/process; full sync engine with conflict resolution.
