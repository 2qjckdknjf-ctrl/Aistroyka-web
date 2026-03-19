# Step 11 — Post-Audit Report

**Date:** 2026-03-18

## 1. Approval scope selection — **FULL**

- Single scope chosen: **worker reports**. Documented in STEP11_APPROVAL_SCOPE_INVENTORY; other candidates (documents, AI checkpoints) explicitly deferred.

## 2. Approval domain model — **FULL**

- Status model and transitions documented (draft → submitted → approved | rejected | changes_requested; resubmit from changes_requested). Roles (submitter, reviewer = canManageProjects), tenant boundary, manager_note semantics. No ambiguous states.

## 3. Approval workflow/API support — **FULL**

- Submission and resubmission (existing). Pending listing (GET reports?status=submitted). Review (PATCH report/:id). Approval history (GET report/:id/approval-history). Auth/tenant and role enforcement in place. No broad API rewrite.

## 4. Approval history/auditability — **FULL**

- report_submit and report_review written to audit_logs. listAuditLogsForResource + approval-history API. Report detail shows “Approval history” from audit. STEP11_APPROVAL_AUDIT_MODEL documents the model.

## 5. Manager-facing approval surfaces — **FULL**

- Dashboard approvals page (pending list with link to report). Report detail: Manager approval card (approve/reject/request changes), manager note, approval history. Project context shown on pending list when project_id present.

## 6. Action/intelligence integration — **FULL**

- Operations queue (priority-actions) already links “Report pending approval” → /dashboard/reports/:id. Recommendation engine surfaces “Review pending reports” with reports_pending → /dashboard/approvals. No new fake signals.

## P0

- None.

## P1

- Optional: resolve reviewer display name (e.g. from users table) in approval history instead of user_id slice only. Out of scope for Step 11.

## P2

- E2E test for submit → review → history visibility. Optional i18n for new strings.

## Is Step 11 closed enough to move forward?

**YES** — Real approval layer for worker reports, explicit semantics, auditable history, manager UI, and integration with existing action layer. Next major step (e.g. Step 12) allowed when product roadmap requires it.
