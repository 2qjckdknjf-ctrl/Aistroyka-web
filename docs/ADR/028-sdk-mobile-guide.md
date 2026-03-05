# ADR-028: SDK and mobile integration guide

**Status:** Accepted  
**Decision:** OpenAPI spec includes sync endpoints (bootstrap, changes, ack), realtime event types (documented in REALTIME-STRATEGY), idempotency headers (x-idempotency-key) and error shapes. packages/api-client (TS) provides sync methods; mobile teams use OpenAPI Generator (Swift/Kotlin). docs/MOBILE-INTEGRATION-GUIDE.md covers iOS Full, iOS Lite, Android: auth, sync flow, idempotency, conflict policy, optional realtime.

**Context:** Phase 4.9; mobile-ready SDK and one guide for all clients.

**Consequences:** Single source for mobile integration; version policy (v1 stable) applies. Sync and idempotency are required for Lite clients.
