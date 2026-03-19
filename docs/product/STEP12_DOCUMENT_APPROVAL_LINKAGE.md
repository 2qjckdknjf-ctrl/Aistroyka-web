# Step 12 — Document Governance / Approval Linkage

**Date:** 2026-03-18

## 1. What is “approval” for documents in this phase

Documents use the existing manager-controlled lifecycle in `public.project_documents`:
- `uploaded → under_review`: submission for review
- `under_review → approved`: approve
- `under_review → rejected`: reject
- `* → archived`: archive (terminal for further status transitions)

This is **not** a legal workflow engine and does **not** add e-sign automation.

## 2. Which document types participate

All three document types participate in the exact same governance semantics:
- `type = document`
- `type = act`
- `type = contract`

They share the same `status` lifecycle and the same manager actions in `ProjectDocumentsPanel`.

## 3. How approval state is visible to managers

In `ProjectDocumentsPanel` managers see:
- status badge for each artifact (`Under review`, `Approved`, `Rejected`, etc.)
- actions:
  - when `uploaded`: “Submit for review”
  - when `under_review`: “Approve” / “Reject”
- “History” modal:
  - fetches `/api/v1/projects/:id/documents/:documentId/approval-history`
  - renders auditable governance events from `audit_logs`

Additionally, the panel shows a small banner:
- “N document(s) pending review” when any docs are `under_review`

## 4. Auditable approval history (why this is real)

We emit audit events in `lib/domain/documents/document.service.ts` on explicit status transitions:
- `document_upload` (draft → uploaded)
- `document_submit_for_review` (uploaded → under_review)
- `document_review` (under_review → approved/rejected)
- `document_archive` (any → archived)

The history endpoint reuses existing audit storage:
- `listAuditLogsForResource(supabase, tenantId, "document", documentId)`

## 5. Integration with existing action/intelligence and approval surfaces

What we integrated (and where):
- **Action/intelligence:** `recommendation-engine.service.ts` already counts `project_documents.status = under_review` and emits:
  - “Review pending documents”
  - navigates to the project’s documents tab via existing resource link mapping.
- **Approvals page:** we did **not** add a separate `/dashboard/approvals` queue for documents (kept scope minimal).
  - Document review is handled in the existing `ProjectDocumentsPanel`, which is already a manager action surface.

## 6. Safety / tenant boundaries

- All document mutations are tenant-scoped and role-restricted by `canManageProjects`.
- Backend status transitions are enforced:
  - managers cannot skip governance (e.g. uploaded → approved is blocked).

