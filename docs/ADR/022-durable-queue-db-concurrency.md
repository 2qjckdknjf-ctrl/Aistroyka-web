# ADR-022: Durable job queue (DB + tenant concurrency)

**Status:** Accepted  
**Decision:** Keep DB-backed job queue with strict time budgeting and per-tenant concurrency. No Cloudflare Queues or Durable Objects: wrangler has no queue/DO bindings; adding them would require infra change. Implemented: queue adapter interface (IQueueAdapter), queue.db.ts (enqueue, claim, tryAcquireSlot, releaseSlot), tenant_concurrency table and try_acquire_job_slot / release_job_slot RPCs. Idempotent enqueue via optional dedupe_key (unique index tenant_id + dedupe_key). Handlers are idempotent; at-least-once delivery is safe.

**Context:** Phase 4.3; Cloudflare-first but no Queues/DO in current repo. Option C (DB + concurrency) chosen as fallback.

**Consequences:** If CF Queues are added later, implement queue.cloudflare.ts and switch adapter in queue.service. Job processing remains within Worker time budget; tenant_concurrency caps concurrent jobs per tenant (default 2).
