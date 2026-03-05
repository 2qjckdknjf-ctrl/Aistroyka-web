# ADR-029: Idempotency and conflict policy

**Status:** Accepted  
**Decision:** All v1 write endpoints support `x-idempotency-key`. Mobile clients must send it on every write; same key returns cached response without re-applying. Conflict strategy: server-authoritative for task assignments and approvals; last-write-wins for draft notes (with version field where applicable); reject conflicting updates with 409 and conflict payload when merge is not safe. Documented in SYNC-CONFLICT-POLICY.md.

**Context:** Phase 4.1/4.9; mobile offline retries and sync conflicts.

**Consequences:** Clients that retry with same idempotency key never duplicate writes. 409 forces client to refresh and retry or merge.
