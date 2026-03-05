# ADR-020: Offline-first sync engine (cursor + change_log)

**Status:** Accepted  
**Decision:** Implement cursor-based delta sync with sync_cursors (per tenant/user/device) and change_log (monotonic id, tenant_id, resource_type, resource_id, change_type, payload). Endpoints: GET /api/v1/sync/bootstrap (snapshot + cursor), GET /api/v1/sync/changes?cursor=&limit= (deltas + nextCursor), POST /api/v1/sync/ack (store device cursor). Every domain write (report create/submit, media create/finalize) emits a change_log row. Conflict strategy: server-authoritative for assignments/approvals; 409 for conflicting updates; idempotency keys on all writes.

**Context:** Phase 4.1 mobile-grade offline-first; iOS Lite and Android need reliable sync with intermittent connectivity.

**Consequences:** change_log grows unbounded without retention; Phase 4.6 retention can prune by ts. Payload must stay minimal and free of secrets.
