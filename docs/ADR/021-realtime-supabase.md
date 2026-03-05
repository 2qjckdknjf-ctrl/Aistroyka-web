# ADR-021: Real-time updates via Supabase Realtime

**Status:** Accepted  
**Decision:** Use Supabase Realtime (Postgres changes) for live updates on the Manager dashboard and worker status. Channels: tenant:{tenantId}, project:{projectId} (latter for project-scoped tables when needed). Tables: jobs, worker_reports, upload_sessions, task_assignments; enable in Supabase Realtime publication. No SSE endpoints; Realtime is already available and fits the stack.

**Context:** Phase 4.2 requirement for web Manager to see live progress (uploads, jobs, report status). Supabase Realtime is already used elsewhere (e.g. AI state); adding tenant-scoped postgres_changes is consistent.

**Consequences:** Tables must be added to the realtime publication (Dashboard or migration). Client uses subscribeTenantRealtime(supabase, tenantId, callbacks); backend does not publish explicitly—writes to DB are reflected automatically.
