# ADR-038: Compliance readiness and security posture

**Status:** Accepted  
**Decision:** docs/COMPLIANCE-READINESS.md covers data retention, audit coverage, RBAC, incident response, change management, secrets management. GET /api/v1/admin/security/posture returns JSON: debug_enabled_in_prod (must be false in prod), retention_policy_days, sso_enabled, critical_alerts_last_30d. Admin only.

**Context:** Phase 5.7; SOC2-lite controls.

**Consequences:** Single endpoint for security posture; auditors can use compliance doc and posture payload.
