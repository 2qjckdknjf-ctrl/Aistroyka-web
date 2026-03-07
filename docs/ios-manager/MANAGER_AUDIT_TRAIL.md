# Manager Action Audit Trail (Phase 4)

**Date:** 2026-03-07  
**Scope:** Backend persistence of manager actions; optional read API.

---

## Backend persistence

- **Table:** `audit_logs` (id, tenant_id, user_id, trace_id, action, resource_type, resource_id, details, created_at). RLS: insert for tenant members; select for owner/admin only.

- **Actions persisted in Phase 4:**
  - **task_assignment** — emitted in POST /api/v1/tasks/:id/assign after successful assign. details: { assigned_to: workerId }. resource_type: task, resource_id: taskId.
  - **report_review** — emitted in PATCH /api/v1/reports/:id after successful review. details: { status, has_note }. resource_type: report, resource_id: reportId.

- **Existing helper:** `listAuditLogs(supabase, tenantId, rangeDays)` in `@/lib/observability/audit.service` returns up to 500 recent rows for tenant (admin-only by RLS). No PII overexposure; details are minimal.

## Optional read API

- **GET /api/v1/audit/manager-actions?limit=&offset=&days=** — not implemented in Phase 4. Admin can use existing tooling or future dashboard that uses listAuditLogs (filter client-side by action in ['task_assignment','report_review'] if needed).
- **iOS:** No audit screen in Phase 4; backend persistence is sufficient for governance.
