# ADR-021: Real-time updates via Supabase Realtime

**Status:** Accepted  
**Decision:** Use Supabase Realtime (Postgres changes) for manager dashboard and worker status. Add job_events, worker_reports, upload_sessions, worker_tasks, task_assignments to supabase_realtime publication. Clients subscribe with postgres_changes and filter by tenant_id (and project_id where applicable). No SSE endpoints or custom broadcast channels.

**Context:** Phase 4.2; Web Manager needs live progress (uploads, jobs, report status). Supabase is already in stack; Realtime is enabled by default for eligible projects.

**Consequences:** RLS applies to realtime; clients only get rows they can read. Event shape is Postgres row (new/old). Documented in REALTIME-EVENTS.md.
