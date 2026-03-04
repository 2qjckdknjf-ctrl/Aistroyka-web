# ADR-020: Offline-first sync engine (cursor + change_log)

**Status:** Accepted  
**Decision:** Implement sync via sync_cursors (per tenant/user/device) and change_log (monotonic bigserial id as cursor). Endpoints: GET /api/v1/sync/bootstrap (snapshot + cursor), GET /api/v1/sync/changes?cursor=&limit= (deltas), POST /api/v1/sync/ack (store cursor). Domain writes (report create/submit, upload_session create/finalize) emit change_log. x-device-id required on sync; conflict policy documented in SYNC-CONFLICT-POLICY.md (server-authoritative for assignments/approvals, last-write-wins with version for drafts, 409 for conflicts).

**Context:** Phase 4.1 mobile offline-first; iOS Lite and Android need reliable delta sync.

**Consequences:** All write endpoints must support x-idempotency-key; new domain writes (e.g. task assignment) should emit change_log when implemented.
