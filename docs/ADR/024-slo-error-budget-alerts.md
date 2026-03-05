# ADR-024: SLO / error budget / alerts

**Status:** Accepted  
**Decision:** Add slo_daily (tenant_id, date, endpoint_group, requests, errors, p95_latency_ms) and alerts (tenant_id, severity, type, message, resolved_at). Admin endpoints: GET /api/v1/admin/slo/overview, GET /api/v1/admin/slo/tenants/:id, GET /api/v1/admin/alerts. error-budget.service provides errorBudgetConsumed and isSloBreach (target 99.9%). Alert generation (SLO breach 2 consecutive windows, cost spike, job fail spike) is scaffolded: tables and endpoints ready; aggregation and insert from cron/job not implemented in Phase 4.

**Context:** Phase 4.5 SRE-grade observability.

**Consequences:** SLO data must be written by middleware or post-request job; Phase 4 only provides schema and read endpoints.
