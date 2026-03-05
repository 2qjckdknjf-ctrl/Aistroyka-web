# ADR-030: SLO alert generation

**Status:** Accepted  
**Decision:** Alerts are created when: (1) SLO breach for 2 consecutive windows, (2) sudden AI cost spike, (3) job failure spike. Alert records stored in `alerts` table; admin endpoints list and (future) resolve. No external alerting integration by default; webhook/pagerduty can be added via env. Alert severity: info | warn | critical; type: slo_breach | quota_spike | job_fail_spike.

**Context:** Phase 4.5; SRE-grade observability.

**Consequences:** Operators see alerts via GET /api/v1/admin/slo/overview and tenant-specific SLO; aggregation job (or middleware) must populate slo_daily and evaluate breach/spike to create alerts.
