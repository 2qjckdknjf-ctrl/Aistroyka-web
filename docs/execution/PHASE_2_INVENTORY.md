# Phase 2 — Inventory (Documents / Acts / Contracts Workflow Closure)

**Date:** 2026-04-18  
**Stage:** A — Current Truth Inventory  
**Scope lock:** document workflow closure only.

## What Exists (repo truth)

### APIs and domain layer

- Project documents list/create:
  - `GET/POST /api/v1/projects/:id/documents` (`apps/web/app/api/v1/projects/[id]/documents/route.ts`)
- Document detail/update:
  - `GET/PATCH /api/v1/projects/:id/documents/:documentId` (route exists in project docs domain)
- File upload flow:
  - `POST /api/v1/projects/:id/documents/:documentId/upload`
- Owner decision flow:
  - `POST /api/v1/projects/:id/documents/:documentId/decision`
- Approval history:
  - `GET /api/v1/projects/:id/documents/:documentId/approval-history`
- Domain semantics:
  - Types/statuses in `apps/web/lib/domain/documents/document.types.ts`
  - Transition rules in `document.policy.ts`
  - Events/audit in `document-event.repository.ts`

### UI surfaces

- Manager documents workflow panel:
  - `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`
- Unified approvals queue now includes under-review documents and deep-links into document review context:
  - `DashboardApprovalsClient.tsx`

### Data model

- `project_documents` includes:
  - type (`document|act|contract`)
  - status (`draft|uploaded|under_review|approved|rejected|changes_requested|archived`)
  - linkage fields: `report_id`, `task_id`, `milestone_id`
  - review metadata fields (`decision_comment`, `decided_by`)
- Event trail exists in project document events migrations/domain.

## What Is Partial

1. Documents workflow spans multiple entry points (project panel + approvals queue deep-link), but closure-level UX consistency needs verification.
2. Runtime loop matrix for document lifecycle is not yet recorded as a strict evidence table.
3. Manager-facing visibility and completion ergonomics are present but not formally closure-audited for all required paths.

## What Is Missing for Phase 2 Closure

1. Full closure matrix for:
   - create -> upload -> submit under_review -> approve/reject
   - create -> upload -> under_review -> request_changes -> resubmit -> approve/reject
2. Explicit manager workflow proof that document loop feels native (not bolted on).
3. Post-audit with no meaningful Phase 2 tail.

## In/Out of Scope

- **In scope:** document/act/contract workflow closure and manager usability.
- **Out of scope:** legal automation, full ECM/DMS, unrelated approvals/documents redesign outside closure needs.
