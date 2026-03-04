# ADR-016: Audit logs for compliance

**Status:** Accepted  
**Decision:** Add audit_logs table (tenant_id, user_id, trace_id, action, resource_type, resource_id, details jsonb, created_at). Emit on critical actions: login, invite, role_change, task_assignment, report_submit, media_finalize, ai_analysis_complete, export. Admin-only GET /api/v1/admin/audit-logs?range=30d. Best-effort emit (no throw); RLS restricts select to tenant owner/admin.

**Context:** Compliance and forensics require a trail of who did what and when.

**Consequences:** High-volume actions should remain minimal payload; details kept small. Retention enforced separately (data_retention_policies + scheduled job).
