# ADR-007: DB-backed job queue

**Status:** Accepted  
**Context:** Need async job processing (AI analysis on report submit). Cloudflare Workers; no long-running processes.

**Decision:** Use Supabase (PostgreSQL) as the queue: jobs + job_events tables, atomic claim via RPC (SELECT FOR UPDATE SKIP LOCKED, UPDATE status=running). Design allows future migration to Durable Objects or Cloudflare Queues.

**Consequences:** No extra infra; claim is atomic; workers poll via POST /api/v1/jobs/process.
