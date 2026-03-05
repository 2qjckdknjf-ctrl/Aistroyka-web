# ADR-031: Retention safety (archive-first)

**Status:** Accepted  
**Decision:** Retention job never hard-deletes by default. It sets `archived_at` on upload_sessions (and other resources per policy). Storage object deletion only if tenant policy explicitly allows. All retention actions are audited (audit_logs). Dry-run or policy-off means no updates.

**Context:** Phase 4.6; enterprise compliance and recoverability.

**Consequences:** Deleted-by-retention data remains in DB as archived; can be restored or purged in a separate process. Audit trail supports compliance.
