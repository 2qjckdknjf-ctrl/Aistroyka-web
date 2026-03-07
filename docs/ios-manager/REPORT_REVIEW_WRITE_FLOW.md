# Report Review Write Flow (Phase 4)

**Date:** 2026-03-07  
**Scope:** Backend PATCH + audit + iOS wiring for manager report review.

---

## Endpoint design

- **PATCH /api/v1/reports/:id**
  - **Auth:** Bearer or cookies; `createClientFromRequest(request)`.
  - **Role:** `canReviewReport(ctx)` — owner, admin, member (same as manage tasks).
  - **Body:** `{ status: "approved" | "reviewed" | "changes_requested", manager_note?: string | null }`
  - **Response:** 200 with `{ data: ReportDetail }` (same shape as GET, including reviewed_at, reviewed_by, manager_note, media).
  - **Errors:** 400 invalid body/status; 401 no auth; 403 no tenant / insufficient rights / service_role; 404 report not found or not in `submitted` status.

## Role rules

- Only tenant members with role owner, admin, or member can PATCH. Viewer cannot review reports.
- Report must be in `submitted` status; transitions from `draft` are not allowed.

## State transitions

- **submitted** → **approved** | **reviewed** | **changes_requested** (only allowed transition for manager).
- **draft** → (worker submit only).
- No revert (approved/reviewed/changes_requested are terminal for the review flow).

## Persistence fields

- **worker_reports:** `reviewed_at` (timestamptz), `reviewed_by` (uuid → auth.users), `manager_note` (text). Status constraint extended to include approved, reviewed, changes_requested.

## Audit

- On successful PATCH, `emitAudit(supabase, { action: "report_review", resource_type: "report", resource_id, details: { status, has_note } })`.

## iOS wiring summary

- **ManagerAPI.reportReview(reportId:status:managerNote:)** → PATCH, returns ReportDetailDTO.
- **ReportDetailDTO:** added reviewedAt, reviewedBy, managerNote.
- **ReportDetailReviewView:** When status == submitted, shows Approve / Mark reviewed / Request changes + optional note field; on success refreshes report (state updated); loading and error states inline; pull-to-refresh.
