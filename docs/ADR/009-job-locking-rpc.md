# ADR-009: Job locking RPC

**Status:** Accepted  
**Decision:** Single RPC claim_jobs(worker_id, limit, tenant_id?) runs in one transaction: select queued jobs with run_after <= now() FOR UPDATE SKIP LOCKED, update to running and increment attempts, return rows. Security definer; grant to service_role and authenticated.

**Consequences:** No race between workers; one job claimed by one processor.
