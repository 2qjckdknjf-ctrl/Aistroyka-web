# Step 17 — Job / Cron Failure Visibility

## 1. Goal

Operators can see failed jobs grouped by type, recent failures with error preview, whether failures are recurring, and what to do next. Harden and document what already exists; extend only where needed.

---

## 2. What exists today (Step 16)

- **GET /api/v1/admin/ops/diagnostics:** job_failures.by_type (count per job type), job_failures.total, job_failures.recent (up to 20 with id, type, status, created_at, last_error_preview 200 chars).
- **getFailedJobs(supabase, tenantId, limit):** From jobs table; status failed/dead; ordered by created_at desc.
- **getOpsMetrics:** jobs_failed count in window; ai_failed count (AI job types only).
- **getOpsOverview:** queues.aiFailed (list of failed AI jobs with id, status, created_at).
- **Job types:** ai_analyze_media, ai_analyze_report, export, retention_cleanup, push_send, upload_reconcile, ops_events_prune (see job.types).

---

## 3. What operators can do now

- **See failed jobs grouped by type:** diagnostics job_failures.by_type (e.g. ai_analyze_media: 3, upload_reconcile: 1).
- **See recent failures:** job_failures.recent with last_error_preview. Enough to spot "Timeout", "Policy blocked", "Storage error."
- **Understand if recurring:** If same type appears repeatedly in recent and by_type count is high, recurring. If one type dominates by_type, that path is affected.
- **Queue/job path:** by_type keys are job types; map to cron or trigger path (e.g. ai_analyze_media from report media analysis; upload_reconcile from upload flow).
- **What to do next:** Runbook "Job / cron failures" — check last_error; if provider, cross-check ai_runtime; if storage, check uploads; release stuck jobs if worker crashed.

---

## 4. Optional hardening (Step 17)

- **Incident hint:** If job_failures.total > 0, diagnostics can include operator_hints.job_failures: "See runbook Job/cron failures; check job_failures.by_type and recent last_error_preview." (Already covered by general operator_hints; can add one line.)
- **Recurring signal:** In docs, state: "If the same job type has multiple failures in recent (e.g. 3+ ai_analyze_media), treat as recurring; prioritize that job type in runbook."
- No new API required; diagnostics already sufficient. Optional: add to diagnostics response a short **job_failure_hint** string when job_failures.total > 0: "Runbook: Job/cron failures. Dominant type: <first by_type key>." Implement only if minimal and useful.

---

## 5. Cron visibility

- **Cron trigger:** /api/v1/admin/jobs/cron-tick (or platform cron that invokes job processor). Not a "cron status" API; jobs are created and processed by worker/processor.
- **Visibility:** Failed jobs are the visibility. No separate "cron last run" in repo unless job processor logs it. Document: "Cron health is inferred from job creation and job success/failure; if no jobs for a long time, cron may not be firing (check platform cron config)."
