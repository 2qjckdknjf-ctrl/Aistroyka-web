# ADR-036: Event stream and analytics

**Status:** Accepted  
**Decision:** Append-only events table (tenant_id, user_id, trace_id, client_profile, event, ts, props). Key events: report_submit, media_finalize, job_success, job_fail, ai_usage, task_assign, login, export. Analytics: getProductivity (from events), getAiRisk (from events), getOpsKpis (from slo_daily). Admin endpoints: GET /api/v1/admin/analytics/productivity, ai-risk, ops (range=7d|30d|90d). Permission admin:read. No materialized views in initial implementation; aggregation in app.

**Context:** Phase 5.5; product and operational analytics.

**Consequences:** Event volume controlled by sampling non-critical events in callers; key events always recorded. Analytics endpoints read from events and slo_daily.
