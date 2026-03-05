# Real-time updates strategy (Phase 4.2)

**Choice:** Supabase Realtime (Postgres changes). No SSE endpoints; the stack already uses Supabase and Realtime is available with table replication.

## Channels

- **tenant:{tenantId}** — all changes for that tenant (jobs, reports, upload_sessions, task_assignments).
- **project:{projectId}** — changes scoped to a project where applicable (e.g. worker_tasks, jobs with project_id).

## Tables and events

| Table | Events | Filter | Use case |
|-------|--------|--------|----------|
| jobs | INSERT, UPDATE | tenant_id=eq.{tenantId} | Job status (queued → running → success/failed) |
| worker_reports | INSERT, UPDATE | tenant_id=eq.{tenantId} | Report created, status → submitted |
| upload_sessions | INSERT, UPDATE | tenant_id=eq.{tenantId} | Session created, status → finalized |
| task_assignments | INSERT, DELETE | tenant_id=eq.{tenantId} | Assignments added/removed |

Enable these tables in Supabase Dashboard → Realtime → publication (or via `supabase_realtime` publication).

## Client usage

- **Web Manager:** Subscribe to `tenant:{tenantId}` for jobs, worker_reports, upload_sessions to show live progress.
- **Project view:** Subscribe to `project:{projectId}` when we have project-scoped tables in realtime (e.g. worker_tasks by project_id).

## Event payload shape

Postgres change payloads follow Supabase Realtime format: `eventType` (INSERT | UPDATE | DELETE), `new` / `old` record. No custom publish step; DB writes are reflected automatically once the table is in the publication.
