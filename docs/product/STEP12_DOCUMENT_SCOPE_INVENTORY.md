# Step 12 — Document Scope Inventory

**Date:** 2026-03-18

## 1. Existing document-adjacent structures (repo truth)

### 1.1 DB entity already present: `public.project_documents`
Migration: `apps/web/supabase/migrations/20260307400000_project_documents.sql`

Supports:
- `type`: `document | act | contract`
- `status`: `draft | uploaded | under_review | approved | rejected | archived`
- `project_id`, `tenant_id`, `created_by`
- storage reference: `object_path` (uploaded to `MEDIA_BUCKET` via storage)
- optional linkage: `report_id`, `task_id`, `milestone_id`

### 1.2 Domain code already present
- Types: `apps/web/lib/domain/documents/document.types.ts`
- Repository (list/get/create/update): `apps/web/lib/domain/documents/document.repository.ts`
- Service (list/create/update with tenant + role checks): `apps/web/lib/domain/documents/document.service.ts`

### 1.3 API already present
- `GET /api/v1/projects/:id/documents` (list)
- `POST /api/v1/projects/:id/documents` (create metadata)
- `PATCH /api/v1/projects/:id/documents/:documentId` (update metadata/status)
- `POST /api/v1/projects/:id/documents/:documentId/upload` (upload file to storage + set `uploaded`)

### 1.4 Manager UI already present
Panel: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx`

Manager can:
- create document/act/contract metadata
- upload a file (from `draft` -> `uploaded`)
- submit for review (`uploaded` -> `under_review`)
- approve/reject (`under_review` -> `approved|rejected`)
- archive (can be set via PATCH; UI currently focuses on review)

### 1.5 Action/Intelligence integration already partially wired
Recommendation engine already counts pending documents:
`apps/web/lib/ai-brain/services/recommendation-engine.service.ts`

It emits recommendation:
- title: “Review pending documents”
- derived from `project_documents.status = under_review`
- navigation uses existing resource link mapping for `documents` → project documents tab.

## 2. Candidates and evaluation

### Generic project document / act / contract (current reality)
**Fit:** Strong — DB table + UI + API already exist with type + status semantics.
**Approval linkage:** Exists as status transitions in the UI, but is not auditable and not enforced on the backend.
**Decision:** Choose as the smallest high-value scope.

### Worker reports (already have approval flow)
Not needed here; we reuse the pattern for governance/audit but keep docs as the target.

## 3. Chosen scope for Step 12

**Chosen scope:** Complete the “Documents / Acts / Contracts Layer” into a real, manager-controlled artifact lifecycle by:
1. Enforcing status transition semantics on the backend (so API cannot “skip” governance).
2. Adding auditable approval/history for document review transitions using existing `audit_logs` (`emitAudit`).
3. Extending manager UI with:
   - stronger linkage display (report/task/milestone if present)
   - ability to view approval history for a document (no fake linkages; honest audit-based history).
4. Minimal action/intelligence integration (already present) — ensure wording and routes remain consistent.

## 4. Deferred scope (explicit reasons)

- Entity-level “approval task items” separate from the documents panel (giant approvals queue): deferred; keep it within the existing project documents UI and the existing recommendations.
- Deep-link to a specific document row across all surfaces (hash anchors/scroll): optional follow-up; not required for core doc lifecycle closure.
- E-sign/legal automation: explicitly out of scope for this phase.
- Contract-specific legal workflow: deferred (would expand the approval domain taxonomy significantly).

