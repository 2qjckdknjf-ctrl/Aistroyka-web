# ADR-012: Mobile sync approach

**Status:** Accepted  
**Decision:** `GET /api/v1/worker/sync?since={iso}` returns serverTime, traceId, and delta of tasks, reports, upload session statuses. No full sync engine in Phase 2; minimal foundation. All write endpoints accept x-idempotency-key; responses include serverTime/traceId where applicable.

**Consequences:** Mobile can reconcile after offline; full conflict resolution and pagination in Phase 3.
