# STEP12 Documents / Acts / Contracts — 100% Closure Report

## Scope Lock

- This closure sprint is limited to Step 12 documents layer.
- No Step 13 work, no budget/cost redesign, no Android work, no broad dashboard redesign.

## Phase 1 Inventory

### Existing files and routes

- API:
  - `apps/web/app/api/v1/projects/[id]/documents/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/upload/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/decisions/route.ts`
  - `apps/web/app/api/v1/projects/[id]/documents/[documentId]/approval-history/route.ts`
- Domain:
  - `apps/web/lib/domain/documents/document.service.ts`
  - `apps/web/lib/domain/documents/document.repository.ts`
  - `apps/web/lib/domain/documents/document.policy.ts`
  - `apps/web/lib/domain/documents/document-event.repository.ts`
  - `apps/web/lib/domain/documents/document-decision.service.ts`
  - `apps/web/lib/domain/documents/document-upload-path.ts`
- UI:
  - `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
  - integrated from `DashboardProjectDetailClient`.
- DB objects / migrations:
  - `apps/web/supabase/migrations/20260307400000_project_documents.sql`
  - `apps/web/supabase/migrations/20260322000000_document_decision_fields.sql`
  - `apps/web/supabase/migrations/20260328200000_project_document_events.sql`
  - `apps/web/supabase/migrations/20260428110000_owner_bulk_document_decisions_rpc.sql`

### Existing behavior before closure

- Documents list/create/upload/update lifecycle already existed.
- Manager UI already had table, create modal, upload action, submit-for-review, approve/reject actions.
- Missing hard closure points:
  - server-side cross-project linkage validation for `report_id/task_id/milestone_id`,
  - complete linkage selection flow in manager UI (only milestone linkage),
  - decision note UX during approve/reject,
  - explicit archive action in manager flow,
  - strict closure-level audit artifacts.

### Risk classification at inventory point

- P0: missing cross-project linkage guard could allow invalid foreign linkage semantics.
- P1: manager UX lacked full linkage selection + decision-note flow.
- P2: incomplete closure documentation and validation evidence artifacts.

## Phase 2 Backend/API Closure

Implemented:

- Added server-side linkage validation in `document.service`:
  - validates `task_id` belongs to same tenant/project,
  - validates `milestone_id` belongs to same tenant/project,
  - validates `report_id` resolves to same project via report->project derivation.
- Added explicit mutating-route 400 mapping for linkage validation errors:
  - `invalid_report_linkage`,
  - `invalid_task_linkage`,
  - `invalid_milestone_linkage`.
- Hardened optional linkage parsing (trim + empty->undefined) in create/update routes.
- Extended audit transition mapping for submit-for-review to include `draft|uploaded|changes_requested -> under_review`.

## Phase 3 Database/Schema/Security Closure

- `project_documents` schema already contains required workflow core:
  - id/tenant/project/type/status/title/description/object_path/report_id/task_id/milestone_id/created_by/timestamps.
- Decision metadata already present:
  - `decision_comment`, `decided_by` (via migration `20260322000000_document_decision_fields.sql`).
- RLS remains enabled and unchanged; no policy weakening done.
- No destructive schema migration required for this closure; security strengthened at service layer (linkage validation).

## Phase 4 Manager UI Create Flow

Implemented in `ProjectDocumentsPanel`:

- create modal now supports optional linkage selection for:
  - report,
  - task,
  - milestone.
- manager form still supports:
  - type (`document|act|contract`),
  - title,
  - optional description.
- submit remains real API call (`POST /api/v1/projects/:id/documents`) with loading/error handling.

## Phase 5 Manager UI Upload Flow

Verified and retained real upload flow:

- file input calls real backend upload route (`POST /documents/:documentId/upload`),
- loading and file-size error states shown,
- uploaded row updates via query invalidation,
- file link + stored filename fragment displayed in UI row.

## Phase 6 Linkage and Lifecycle Closure

Lifecycle updates:

- Transition policy updated to allow:
  - `draft -> under_review`,
  - `draft -> archived`,
  - existing transitions retained (`uploaded -> under_review`, review outcomes, archive flow).
- UI now exposes:
  - send-to-review for `draft|uploaded|changes_requested`,
  - archive action where allowed by lifecycle.
- Server-side transition guard remains authoritative via `validateDocumentStatusTransition`.

Linkage updates:

- UI linkage selectors now cover report/task/milestone.
- Backend rejects cross-project/cross-tenant linkage attempts.

## Phase 7 Approval / Review UX Closure

Implemented:

- Added approve/reject decision modal with optional manager note (`decision_comment`).
- Approve/reject now call real update API with decision comment.
- Decision comment rendered in document row when present.
- Existing history modal preserved (`DocumentApprovalHistory`).
- API error handling surfaced per-row for lifecycle actions.

## Phase 8 Tests and Validation

- Added/updated tests:
  - `lib/domain/documents/document.service.test.ts` (new linkage validation coverage),
  - `lib/domain/documents/document.policy.test.ts` (updated lifecycle transition expectations).
- Full validation completed (see validation log):
  - typecheck PASS,
  - lint PASS,
  - tests PASS,
  - build PASS,
  - cf:build PASS.

## Files Changed for Step 12 Closure

- `apps/web/lib/domain/documents/document.service.ts`
- `apps/web/app/api/v1/projects/[id]/documents/route.ts`
- `apps/web/app/api/v1/projects/[id]/documents/[documentId]/route.ts`
- `apps/web/lib/domain/documents/document.policy.ts`
- `apps/web/lib/domain/documents/document.policy.test.ts`
- `apps/web/lib/domain/documents/document.service.test.ts`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- `docs/audit/STEP12_DOCUMENTS_100_VALIDATION_LOG.md`
- `docs/audit/STEP12_DOCUMENTS_100_POST_AUDIT.md`
- `docs/audit/STEP12_DOCUMENTS_100_CLOSURE_REPORT.md`

## Closure Summary

- Step 12 workflow is now manager-usable end-to-end:
  - create metadata,
  - optional file upload,
  - optional project-scoped linkage,
  - lifecycle transitions,
  - review/approve/reject with note,
  - archive,
  - immediate UI refresh,
  - tenant/auth/security checks preserved and strengthened.
