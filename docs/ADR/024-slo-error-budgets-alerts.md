# ADR-024: SLO / error budgets / alerts

**Status:** Accepted  
**Decision:** Add slo_daily (tenant_id, date, endpoint_group, requests, errors, p95_latency_ms) and alerts (tenant_id, severity, type, message, resolved_at). SRE module: slo.service (getSloDaily), error-budget.service (consumedErrorBudget), alert.service (createAlert, listAlerts). Admin endpoints: GET /api/v1/admin/slo/overview, GET /api/v1/admin/slo/tenants/:tenantId. Alert generation: create alerts when SLO breach for 2 consecutive windows, AI cost spike, or job failure spike—implemented by scheduled job or post-aggregation step; slo_daily must be populated by middleware or job.

**Context:** Phase 4.5 SRE-grade observability; configurable SLO targets (e.g. 99.9% availability).

**Consequences:** slo_daily is write path from application (middleware or batch); without population, overview returns empty. External alerting (PagerDuty, etc.) can consume alerts table when configured.
