# Step 16 — Centralized Signal Model

## 1. Purpose

One consistent operational vocabulary across routes, jobs, AI, and admin surfaces for observability and alerting.

## 2. Event categories (operational)

Aligned with existing OBSERVABILITY_EVENTS and audit/job reality:

| Category | Description | Examples |
|----------|-------------|----------|
| auth | Authentication / session | auth_login, auth_logout, auth_error |
| tenant_context | Tenant resolution / membership | TenantRequiredError, TenantForbiddenError |
| projects | Project CRUD / access | project_create, project_read |
| worker | Worker day / reports | worker_day_start, worker_report_submit |
| media | Uploads / sessions | media_upload, upload_session_finalize |
| ai | AI runtime | ai_analyze_image, ai_copilot_*, ai_intelligence_*, ai_vision_* |
| jobs | Background jobs | job_queued, job_success, job_failed, job_dead |
| sync | Sync / conflict | sync_conflict (ops_events) |
| upload | Upload lifecycle | upload_stuck, upload_expired |
| push | Push notifications | push_failed |
| rate_limit | Rate limiting | rate_limit_exceeded |
| api_5xx | Server errors | 500, 503 |
| api_4xx | Client errors | 401, 403, 404 |
| system | System/admin routes | /api/system/*, /api/v1/admin/* |

## 3. Error categories (for triage)

Existing ErrorCategory in error-tracking.ts; keep and extend only if justified:

- auth, tenant_context, report_submit, upload, sync, task_assign, review_action, notification, api_5xx, api_4xx, unknown.
- AI-specific: use AIErrorKind (auth_failure, provider_unavailable, provider_timeout, rate_limit, stream_*, etc.) in audit details and logs.

## 4. Route / service / job dimensions

- **route:** API route key (e.g. "GET /api/v1/ops/metrics", "POST /api/v1/projects/:id/estimate/from-image"). From request path + method; stable for aggregation.
- **service:** Logical area: api | jobs | cron | worker. Jobs use type: ai_analyze_media, ai_analyze_report, export, retention_cleanup, push_send, upload_reconcile, ops_events_prune.
- **job_type:** Same as jobs.type for job-level breakdown.

## 5. Severity levels

Existing ErrorSeverity: fatal | error | warn | info. Use for captureException and for alertability (fatal/error = alert-worthy when thresholded).

## 6. Build / release correlation fields

- **build_sha:** Full SHA (optional). **build_sha7:** First 7 chars. From getBuildStamp().sha.
- **build_time:** From getBuildStamp().buildTime (NEXT_PUBLIC_BUILD_TIME).
- **app_env:** NEXT_PUBLIC_APP_ENV ?? NODE_ENV (e.g. production, staging, development).

Include in every operator/diagnostics response so "which release" is always answerable.

## 7. Tenant / project / user-safe correlation

- **tenant_id:** UUID; never log tenant name or PII. Safe in structured logs and audit.
- **user_id:** UUID; never log email or name in observability payloads.
- **project_id:** UUID when needed for scope; no project name in logs.
- **request_id / trace_id:** UUID; correlate logs and audit.

## 8. AI / provider dimensions

- **output_type:** copilot | intelligence | vision.
- **provider:** openai | anthropic | gemini (from AI provider used).
- **error_kind:** AIErrorKind string (auth_failure, provider_timeout, etc.).
- **retryable:** boolean for triage.

## 9. Upload / storage / media dimensions

- **upload status:** created | uploaded | expired; stuck = created/uploaded and older than threshold.
- **No object_path or raw file names in observability;** counts and IDs only.

## 10. System / admin route dimensions

- **Route pattern:** /api/system/* (system), /api/v1/admin/* (admin). Auth: SYSTEM_API_KEY for system; requireAdmin for admin. Do not log admin actions with PII.

## 11. Remaining gaps

- Latency percentiles (p50, p99) require log aggregation or APM; not stored in DB.
- Cross-tenant "global" error rate not in-app; tenant-scoped only.
- Alert routing (Slack, PagerDuty) not implemented; foundation only.
