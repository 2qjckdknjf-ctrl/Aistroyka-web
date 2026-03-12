# Reliability Hardening — Enterprise

**Phase 7 — Enterprise Hardening**

---

## 1. Central log aggregation

- **Current:** Structured logs (`request_finished`, `error_captured`, and other events) are emitted via `logStructured()` to stdout. No central aggregation is configured in repo (no Logflare, Datadog, or Cloudflare Logs pipeline).  
- **Recommendations:**  
  - Send stdout/stderr to a log sink (e.g. Vercel Log Drain, Cloudflare Workers analytics, or third-party).  
  - Index by `event`, `request_id`, `route`, `tenant_id`, `status`, `duration_ms`.  
  - Retain for at least 30 days for pilot; align retention with DATA-RETENTION-STRATEGY and compliance.  
- **Document:** Exact pipeline (e.g. “Vercel → Datadog”) and retention in runbooks.

---

## 2. Dashboards for KPIs (success rates, p95, 5xx hotspots)

- **Current:** KPIs are defined in `docs/pilot/RELIABILITY_METRICS_AND_KPIS.md`. Raw data exists in structured logs (`request_finished`, `error_captured`). No built-in dashboard in repo.  
- **Recommendations:**  
  - In the chosen log/metrics backend, build dashboards for:  
    - Success rate by route (2xx / total).  
    - p95 (and p50/p99) latency by route from `duration_ms`.  
    - 5xx/4xx counts by route and tenant (hotspots).  
    - Error rate from `error_captured` by category.  
  - Optionally expose a minimal ops endpoint (e.g. existing `/api/v1/ops/overview` or `/api/v1/ops/metrics`) for health and high-level counts; keep sensitive detail behind authz.  
- **Document:** Dashboard definitions and refresh frequency.

---

## 3. Alerts and thresholds

- **Current:** No alerting is configured in repo. Runbooks (e.g. `docs/runbooks/incident-response.md`) describe manual checks.  
- **Recommendations:**  
  - Define thresholds: e.g. 5xx rate > 1% over 5 min; p95 > 5s for key routes; error_captured rate spike.  
  - Configure alerts in the same platform used for logs/metrics (e.g. Datadog, PagerDuty, or Cloudflare).  
  - Route alerts to on-call; document in INCIDENT_RESPONSE_PLAYBOOK.  
  - Start with a small set (health check failure, 5xx spike, auth failure spike); expand as needed.

---

## 4. Rate-limit policy review

- **Current:**  
  - `lib/platform/rate-limit/rate-limit.service.ts`: `checkRateLimit(supabase, { tenantId, ip, endpoint })` uses `rate_limit_slots` and per-tenant limits from subscription (FREE/PRO/ENTERPRISE in `lib/platform/subscription/limits.ts`).  
  - Per-tenant and per-IP limits (per minute) apply to HIGH_RISK_ENDPOINTS: `/api/v1/ai/analyze-image`, `/api/v1/worker/report/submit`, `/api/v1/jobs/process`, `/api/auth/login`.  
  - Login has stricter IP limit (5/min). Sync and upload-sessions also use rate limit.  
- **Review:**  
  - Confirm HIGH_RISK_ENDPOINTS list matches all sensitive/write-heavy endpoints.  
  - Confirm per-tenant limits are appropriate for enterprise tiers (see limits.ts).  
  - Rate limit is enforced only when Supabase (and subscription) is available; on failure, routes log `rate_limit_unavailable` and allow the request (fail-open). Document and consider fail-closed for auth/login.  
- **Recommendations:**  
  - Add rate limiting to other high-impact routes (e.g. task assign, report review) if needed.  
  - Document rate-limit policy (per endpoint, per tier) in this doc or a dedicated rate-limit runbook.

---

## 5. Background job retry / backoff strategy

- **Current:**  
  - `lib/platform/jobs/job.config.ts`: `BACKOFF_BASE_MS = 2000`, `BACKOFF_MAX_MS = 600_000`, `DEFAULT_MAX_ATTEMPTS = 5`.  
  - `nextRunAfter(attempt)` uses linear backoff (attempt * base), capped at BACKOFF_MAX_MS.  
  - Jobs are marked failed for retry via `markFailedForRetry(admin, jobId, lastError, lastErrorType, runAfter)`; after max attempts they can move to dead.  
  - Handlers (e.g. push-send, upload-reconcile) use retryable vs non-retryable error classification.  
- **Recommendations:**  
  - Consider exponential backoff (e.g. base^attempt) for faster early retries and longer spacing later.  
  - Document which job types are retried and which go to dead letter; ensure dead-letter jobs are visible (e.g. admin view or runbook query).  
  - Keep WORKER_TIME_BUDGET_MS and claim limits aligned with deployment timeout (e.g. Cloudflare Worker limit).

---

## 6. Backup and restore verification

- **Current:** Backup/restore is documented in `docs/security/backup-restore.md` (if present) and may be handled by Supabase or hosting. No automated verification script in repo.  
- **Recommendations:**  
  - Document backup schedule and RPO/RTO for Supabase (and any other stateful stores).  
  - Periodically verify restore: restore to a staging DB from backup, run smoke checks, document in runbook.  
  - Include audit_logs, jobs, and tenant-critical tables in backup scope and restore tests.

---

## Control summary

| Control | Status | Notes |
|---------|--------|--------|
| Central log aggregation | Recommended | Not in repo; define pipeline and retention |
| Dashboards (KPIs) | Recommended | Define in log/metrics backend from existing events |
| Alerts and thresholds | Recommended | Define and wire to on-call |
| Rate-limit policy | Implemented | Review HIGH_RISK_ENDPOINTS and fail-open behavior |
| Job retry/backoff | Implemented | Document dead-letter and consider exponential backoff |
| Backup & restore | Documented | Verify restore periodically |
