# Wave 4 Step 3 — Executive summary

## Purpose

Deliver a **controlled** documents / acts / contracts layer on top of the existing schedule, approvals, and report backbone — not a DMS/ECM.

## What shipped (conceptual)

1. **Model:** `project_documents` with types `document` | `act` | `contract` and explicit status lifecycle.
2. **Governance:** Policy-validated transitions, audit trail, **append-only `project_document_events`** for manager-visible history, owner **decision** endpoint.
3. **Manager UX:** Project Documents tab (list, create, upload, review actions, history), summary and pending-decision signals on project detail.
4. **Integration:** `getProjectSummary` counts for active documents and pending document decisions.

## Key files (reference)

- Migrations: `20260307400000_project_documents.sql`, `20260322000000_document_decision_fields.sql`, `20260328200000_project_document_events.sql`
- Domain: `apps/web/lib/domain/documents/`
- API: `apps/web/app/api/v1/projects/[id]/documents/`
- UI: `ProjectDocumentsPanel.tsx`, `DocumentApprovalHistory.tsx`, `DashboardProjectDetailClient.tsx`

## Deferred (by design)

Budget, ERP/BIM, Android expansion, enterprise search, e-sign, legal automation, broad dashboard redesign.

## Validation snapshot

- `npm run test` (apps/web): pass  
- `npm run build` (root): pass  

## Closure

Wave 4 Step 3 meets the success definition in the phase brief; proceed to the next Wave 4 sub-step after applying the document-events migration in target environments.

See **WAVE4_STEP3_DOCUMENTS_POST_AUDIT.md** for strict FULL/PARTIAL/OPEN classification.
