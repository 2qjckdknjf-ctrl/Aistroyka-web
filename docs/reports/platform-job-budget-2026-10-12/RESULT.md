# Platform claim budget and attempt accounting — 2026-10-12

Baseline: protected #443 main e22cb37d329ac5310d74692664da7d8356ee75fd. Existing claim_jobs increments attempts and marks a batch running before returning. The processor incremented that count again for logs and retry thresholds; at max_attempts=5 it could dead-letter the fourth execution. A slow first handler also exhausted the request budget while remaining batch rows stayed running without dispatch.

The processor now claims one job immediately before each dispatch, stops before claiming the next when the time budget expires, and uses the RPC's current attempt for backoff/dead/logging. Concurrency-blocked and lease-read-failed claims never reached a handler, so a new exact-lease CAS requeues them and refunds that claim's attempt. A replacement worker's lock/counter is unchanged.

69 platform job tests PASS, including budget exhaustion after one handler, retry at attempt 4/dead at 5, unstarted concurrency release and existing scope/audit/media cases. Five isolated native PostgreSQL contracts PASS using the actual repository/SDK, including refund and replacement rejection. TypeScript/scoped lint PASS. No DDL. Protected CI/review/deployment and final live readback follow. Crash/stale-lease recovery and atomic push outbox claim remain distinct tasks; this repair does not claim exactly-once side effects or stored report AI results.

Review P2 closed: budget is also checked after claim, ownership read and slot acquisition. An expired budget requeues/refunds the exact unstarted lease, emits a retry only on a CAS win, never invokes the handler and releases any acquired slot in finally. Six delayed-network phase/CAS winner-loser tests PASS.
