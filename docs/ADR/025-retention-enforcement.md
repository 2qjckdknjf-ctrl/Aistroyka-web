# ADR-025: Retention enforcement job

**Status:** Accepted  
**Decision:** Retention cleanup runs as job type retention_cleanup. Reads data_retention_policies (media_retention_days, etc.); for upload_sessions, marks rows older than retention window with archived_at (no hard-delete by default). Emit audit_log for retention_cleanup with archived_count. Storage object deletion only when policy explicitly allows; archive state is default for enterprise.

**Context:** Phase 4.6; Phase 3 documented strategy; now enforced via scheduled job.

**Consequences:** upload_sessions has archived_at; queries may filter is null for active sessions. change_log and ai_usage retention can be added to the same job when policy columns are used.
