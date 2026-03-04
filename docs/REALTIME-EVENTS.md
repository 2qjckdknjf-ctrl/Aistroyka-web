# Real-time events (Supabase Realtime)

Manager dashboard and worker status use **Supabase Realtime** (Postgres changes). No SSE endpoints; subscriptions are against the database.

---

## Subscription model

- **Channel concept:** Subscribe to table changes filtered by `tenant_id` (and optionally `project_id`). No custom "tenant:{id}" broadcast channel; use `postgres_changes` with filter.
- **Tables in publication:** `job_events`, `worker_reports`, `upload_sessions`, `worker_tasks`, `task_assignments` (when present).

---

## Client subscription pattern

1. **Job events (per tenant)**  
   `postgres_changes` on `job_events` with filter: `job_id in (select id from jobs where tenant_id = <tenantId>)`.  
   Or subscribe to `jobs` table with filter `tenant_id=eq.<tenantId>` and then join to job_events if needed.  
   Simpler: subscribe to `job_events` and filter in app by tenant (job_events.job_id → jobs.tenant_id). Supabase filter is row-level; for job_events we need a filter that ties to tenant. So either add tenant_id to job_events (redundant) or subscribe to `jobs` table for status changes.  
   Jobs table has status updates; job_events is append-only. So subscribing to `jobs` (status, updated_at) gives "job completed/failed" and subscribing to `job_events` gives event stream. We added job_events to publication so clients can listen to new events and then resolve job_id → job → tenant_id in app, or we document "subscribe to jobs with tenant_id filter".

2. **Worker reports**  
   `postgres_changes` on `worker_reports` with filter `tenant_id=eq.<tenantId>`.

3. **Upload sessions**  
   `postgres_changes` on `upload_sessions` with filter `tenant_id=eq.<tenantId>`.

4. **Worker tasks**  
   `postgres_changes` on `worker_tasks` with filter `tenant_id=eq.<tenantId>`. For project-scoped: filter `project_id=eq.<projectId>`.

5. **Task assignments**  
   `postgres_changes` on `task_assignments` with filter `tenant_id=eq.<tenantId>`.

---

## Event payload shape

Supabase sends `INSERT`/`UPDATE`/`DELETE` with `new`/`old` record. No custom envelope. Client code should handle payload per table schema (see API/DB docs).

---

## Why Supabase Realtime (not SSE)

- Already in stack; no extra Workers or SSE infrastructure.
- Postgres changes are consistent and durable.
- RLS applies; clients only receive rows they can read.
- Single connection (Supabase client) for both REST and realtime.
