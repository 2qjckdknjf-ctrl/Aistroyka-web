# ADR-005: Worker Lite API scope

**Status:** Accepted  
**Context:** Mobile Worker Lite app needs a minimal set of real endpoints for day and report workflow.

**Decision:** Implement six endpoints under `/api/v1/worker/`: tasks/today (GET), day/start (POST), day/end (POST), report/create (POST), report/add-media (POST), report/submit (POST). All require TenantContext; role must be at least member for write (viewer for tasks/today). DB: worker_day, worker_reports, worker_report_media, worker_tasks with RLS. Payloads kept small and mobile-friendly; contracts used where applicable.

**Consequences:** Worker Lite can drive a full “start day → create report → add media (via upload_session_id or media_id) → submit” flow. No full resumable upload in Phase 1.
