# ADR-026: Data residency foundation (tenant_settings)

**Status:** Accepted  
**Decision:** Add `tenant_settings` table with `tenant_id` (PK), `data_residency` (text, e.g. EU/US/default), `created_at`, `updated_at`. Use for governance and documentation only; do not implement multi-database or region routing in Phase 4. Document how to split data later (e.g. per-region DB, routing by tenant_settings.data_residency).

**Context:** Phase 4.7; enterprise clients may require EU/US data residency; we provide metadata hook without building multi-region infra now.

**Consequences:** Policy engine and runbooks can read data_residency for audit/compliance; actual routing and multi-DB deferred to Phase 5+.
