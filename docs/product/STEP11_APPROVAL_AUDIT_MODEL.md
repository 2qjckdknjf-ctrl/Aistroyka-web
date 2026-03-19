# Step 11 — Approval Audit Model

## Captured events

| Event | When | Stored | Details |
|-------|------|--------|---------|
| **report_submit** | Worker submits (draft → submitted or changes_requested → submitted) | audit_logs | — |
| **report_review** | Manager sets approved / rejected / changes_requested | audit_logs | `{ status, has_note }` |

Both use `resource_type: "report"`, `resource_id: report.id`. `user_id` = actor (submitter or reviewer).

## Report row (current decision)

- `reviewed_at`, `reviewed_by`, `manager_note` — set on latest review only. For full history, use audit.

## Retrieval

- **Per-report history:** `GET /api/v1/reports/:id/approval-history` → `listAuditLogsForResource(tenantId, "report", reportId)`. Returns ordered events (oldest first) for report_submit and report_review.
- **Tenant-wide:** Existing `listAuditLogs(tenantId, rangeDays)` for admin; filter client-side by resource_type/resource_id if needed.

## Reuse

- Single audit system (`audit_logs` + `emitAudit`). No separate approval_events table. Report detail UI shows "Approval history" from this API.
