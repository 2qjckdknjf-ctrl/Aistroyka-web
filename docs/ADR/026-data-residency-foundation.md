# ADR-026: Data residency foundation

**Status:** Accepted  
**Decision:** Add tenant_settings (tenant_id pk, data_residency text, created_at) for metadata only. Values e.g. EU, US, etc. Document how to split later (multi-db or region routing); do not implement multi-db or region routing in Phase 4. Use in governance and docs when referring to tenant preferences.

**Context:** Phase 4.7 multi-region/data residency; enterprise requirement for future EU/US split.

**Consequences:** Application can read data_residency for display or policy; no routing or replication implemented.
