# ADR-022: Durable queue (DB) + tenant concurrency

**Status:** Accepted  
**Decision:** Keep DB-backed job queue (jobs + claim_jobs RPC). No Cloudflare Queues or Durable Objects in current wrangler config; adding tenant_concurrency table and try_acquire_job_slot / release_job_slot so we do not start a job if the tenant is at concurrency cap (default max 2 running per tenant). Queue abstraction: queue.interface.ts, queue.db.ts, queue.service.ts; processJobs uses getQueueAdapter() and enforces slot acquire before run, release in finally. Option A (Cloudflare Queues) can be added later via queue.cloudflare.ts when bindings exist.

**Context:** Phase 4.3; production-grade at-least-once, idempotent handlers, noisy-neighbor prevention.

**Consequences:** Tenant concurrency row created on first try_acquire; default max_jobs_running = 2. Job that cannot acquire slot is re-queued (run_after = now) and will be retried next poll.
