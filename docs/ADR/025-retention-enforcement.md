# ADR-025: Retention enforcement job

**Status:** Accepted  
**Decision:** Add job type retention_cleanup with payload tenant_id. Handler reads data_retention_policies, archives old upload_sessions (set archived_at) per media_retention_days; no hard-delete. Emit audit for retention_cleanup with archived_count. upload_sessions gets archived_at column. AI usage and report retention left for later; same pattern (archive or soft-delete only when policy enables).

**Context:** Phase 4.6; DATA-RETENTION-STRATEGY scaffold now enforced for upload_sessions.

**Consequences:** Scheduled enqueue of retention_cleanup per tenant (cron or admin trigger) required to run; no automatic schedule in Phase 4.
