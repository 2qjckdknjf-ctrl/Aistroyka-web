# Wave 4 Step 2 — Manager UI (Stage D)

## Surfaces

### Approval queue

- **`/dashboard/approvals`** — `DashboardApprovalsClient` lists `GET /api/v1/reports?status=submitted` (existing), links to report detail.

### Report detail

- **`/dashboard/reports/[id]`** — `ReportApprovalCard` when `status === "submitted"`: Approve / Reject / Request changes; **notes** supported for reject, request changes, and optional note on approve.
- **`ReportApprovalHistory`** — reads approval-history API; renders new `report_approval_events` shape or legacy audit shape.

### Project overview

- **`DashboardProjectDetailClient`** — “Open reports” card shows **submitted — awaiting approval** line with link to **review queue** when `pendingReportApprovalsCount > 0`.
- **“Workload & governance”** block lists `attentionItems` from project summary API, including **Reports awaiting approval** with link to `/dashboard/approvals`.

## Patterns

- Reused existing `Card`, `Button`, `Badge`, React Query.
- No full dashboard redesign.

## Limitations

- Approvals page is tenant-wide queue (not project-filtered URL in this step); project context is visible on report rows where `project_id` resolves.
