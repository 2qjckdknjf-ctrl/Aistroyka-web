# Step 16 — Observability Inventory

## 1. What exists today

### 1.1 Request / trace correlation

- **trace.ts:** getOrCreateTraceId(request) from x-request-id or generate UUID; addRequestIdToResponse. Used by withRequestIdAndTiming.
- **request-timing.ts:** withRequestIdAndTiming(request, response, { route, method, duration_ms, tenantId, userId }) — sets x-request-id on response, logs request_finished (event, request_id, route, method, status, duration_ms, tenantId, userId).
- **Usage:** Multiple API routes use withRequestIdAndTiming (ops/metrics, ops/overview, analysis/process, media upload-sessions, jobs/process, worker report/submit, sync, tasks/assign, etc.). Not every route is instrumented.
- **Correlation:** trace_id / request_id in audit_logs; AI telemetry and audit details include request_id. Operator can match trace_id in audit to JSON log lines (request_id).

### 1.2 Structured logs

- **logger.ts:** logStructured(payload) — JSON to console with ts; sanitize() redacts token/password/secret/authorization/cookie/api_key. LogEvent type: event, request_id, route, method, status, duration_ms, tenantId, userId, error_type, error_code, component, etc. NODE_ENV=test skips logging.
- **Events:** request_finished, error_captured, ai_request, ai_copilot_*, ai_intelligence_*, ai_vision_*, job_*, ops_events_pruned. No persistent log store in repo; logs are stdout/aggregated by platform (e.g. Vercel/CF).

### 1.3 Audit logs

- **audit.service.ts:** emitAudit(supabase, { tenant_id, user_id, trace_id, action, resource_type, resource_id, details }) → audit_logs table. listAuditLogs, listAiRuntimeAuditRows, aggregateAiRuntimeRows. AiRuntimeAuditDetails: request_id, route, latency_ms, output_type, provider, error_kind, retryable, build_sha7, app_env — no prompts/secrets.

### 1.4 AI telemetry

- **ai-telemetry.ts:** logCopilotStreamLifecycle, logCopilotStreamComplete, logCopilotStreamError, logIntelligenceComplete, logIntelligenceError, logVisionAnalyzeComplete, logVisionAnalyzeError. AIErrorKind enum. getAiReleaseCorrelation() → build_sha7, app_env. All log to logStructured (no DB write for these; audit is separate).
- **ai.service.ts:** logStructured(ai_request) with provider, model, tier, latency_ms, tokens, cost, policy_decision_id, result_status.

### 1.5 System / admin / ops routes

- **GET /api/system/metrics:** SYSTEM_API_KEY; getSystemMetrics (projects, tasks, reports, alerts, ai_signals counts); _meta.source, _meta.at. No build stamp in response.
- **GET /api/v1/ops/metrics:** Tenant-scoped; getOpsMetrics (uploads_stuck, uploads_expired, devices_offline, sync_conflicts, ai_failed, jobs_failed, push_failed, tasks_*). withRequestIdAndTiming.
- **GET /api/v1/ops/overview:** Tenant-scoped; getOpsOverview (kpis + queues: reports pending, stuck uploads, workers open shift, push failed, ai failed, tasks open/overdue). withRequestIdAndTiming.
- **GET /api/v1/admin/ops/ai-runtime:** Admin; listAiRuntimeAuditRows + aggregateAiRuntimeRows; drilldown by_route, complete_count, error_count, error_rate_window; operator_hints; correlation: build_sha, build_time, app_env.

### 1.6 Jobs / cron visibility

- **jobs:** jobs table (type, status, last_error, tenant_id, created_at). getFailedJobs in metrics.service (tenant-scoped). getOpsMetrics counts failed/dead in window; getOpsOverview returns aiFailed list. No global admin "all failed jobs" route in repo; tenant-scoped only.
- **Cron:** /api/v1/admin/jobs/cron-tick; job types include ai_analyze_media, ai_analyze_report, export, retention_cleanup, push_send, upload_reconcile, ops_events_prune.

### 1.7 Upload / media failure visibility

- **ops-metrics:** uploads_stuck (status created/uploaded, older than UPLOAD_STUCK_HOURS), uploads_expired. ops-overview: stuckUploads list, queues.
- **No dedicated "upload failure reason" aggregation** beyond stuck/expired counts.

### 1.8 Auth / tenant failure visibility

- **error-tracking:** ErrorCategory includes auth, tenant_context. captureException(error, { request_id, route, tenant_id, user_id, category, severity, code }) → logStructured(error_captured). No DB persistence; log-only.
- **Audit:** login action in audit_logs when login is recorded; no dedicated "auth failure" table.

### 1.9 Build / release metadata

- **getBuildStamp():** NEXT_PUBLIC_BUILD_SHA → VERCEL_GIT_COMMIT_SHA → GITHUB_SHA; NEXT_PUBLIC_BUILD_TIME. Returned in admin/ops/ai-runtime as correlation.build_sha, build_time, app_env. Not in /api/system/metrics or /api/v1/ops/* responses.

### 1.10 External tooling hooks

- **No Sentry/DataDog integration in repo.** captureException is structured for future forwarding. Logs are JSON for aggregator consumption. No explicit webhook or export for alerts.

---

## 2. Strongest signals

- **Request ID / trace:** Consistent x-request-id and request_finished logs; trace_id in audit_logs. Strong for correlating a single request across logs and audit.
- **AI runtime audit:** audit_logs (resource_type=ai_runtime) with action, details (route, latency_ms, error_kind, provider). Admin ai-runtime endpoint with by_route, error_count, error_rate_window, operator_hints.
- **Ops metrics/overview:** Counts and queues (stuck uploads, failed jobs, sync conflicts, push failed, ai failed, tasks). Tenant-scoped; good for "what is broken in this tenant."
- **Build correlation:** getBuildStamp; exposed in ai-runtime response. Not yet in other operator endpoints.
- **Error categories:** captureException with category (auth, tenant_context, upload, sync, api_5xx, etc.) and severity; log-only.

---

## 3. Biggest blind spots

- **No single "operational status" view** that combines build + ops metrics + AI drilldown + job failure breakdown. Operator must hit multiple endpoints.
- **Build/release not on every diagnostics response:** Only ai-runtime returns correlation; ops/metrics and ops/overview do not.
- **error_captured and request_finished are log-only:** No DB aggregation for "error rate by route" or "latency p99 by route" inside the app. Would require log pipeline or external APM.
- **Job failures:** Visible per-tenant (getFailedJobs, ops overview); no cross-tenant or by-job-type breakdown in one admin view.
- **No explicit alert transport:** No webhook, no PagerDuty/Slack wiring; system is "alert-ready" only in the sense that signals exist in logs/audit.

---

## 4. Current operator pain points

- Correlating an incident to a deployment requires opening ai-runtime for build_sha; ops/metrics and overview don’t show it.
- No one place to see "recent AI errors + recent job failures + build" for a tenant.
- Route-level error/latency aggregation depends on external log tools; not in-app.

---

## 5. Priority ranking

| Priority | Item | Rationale |
|----------|------|------------|
| P0 | Single diagnostics view combining build + ops + AI + job failures | Reduces operator toggling; answers "what is failing and which build." |
| P0 | Build/release correlation on all operator-facing diagnostics | So every response supports "which release." |
| P1 | Canonical signal/error model doc | Consistent vocabulary for route/category/severity. |
| P1 | Alertability foundation doc | Where alerts would come from; thresholds; gaps. |
| P2 | Log-based aggregation (error rate by route) | Out-of-app or future; document as external. |
