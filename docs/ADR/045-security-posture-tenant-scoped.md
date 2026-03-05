# ADR-045: Security posture tenant-scoped

**Status:** Accepted  
**Decision:** GET /api/v1/admin/security/posture returns data for current tenant only (retention policy, SSO enabled, critical alerts count). debug_enabled_in_prod is environment-level. Same-tenant isolation preserved.

**Context:** Phase 5.7 compliance.
