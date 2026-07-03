# P1 — Document Workflow Inventory

**Date:** 2026-07-02  
**Scope:** Manager-usable documents / acts / contracts workflow (P1 Task A)  
**Verdict:** Inventory complete — implementation largely exists; P1 closure patches applied in this slice.

---

## Executive summary

AISTROYKA has a **unified `project_documents` layer** (not a full DMS). Managers can create document/act/contract records, upload files to Supabase `media` bucket, link to project + optional report/task/milestone, and run a governed review lifecycle. P1 fixes extended re-upload after `changes_requested`, manager **request changes** on documents, and corrected queue/count bugs caused by querying non-existent `worker_reports.project_id`.

---

## Database / migrations

| Artifact | Path | Notes |
|----------|------|-------|
| Core table | `apps/web/supabase/migrations/20260307400000_project_documents.sql` | `project_documents`: type, title, status, `object_path`, linkages |
| Decision fields | `20260322000000_document_decision_fields.sql` | `decision_comment`, `decided_by` |
| Events | `20260328200000_project_document_events.sql` | `project_document_events` append-only |
| `changes_requested` status | `20260322000000_document_decision_fields.sql` (status check extended) | Added to lifecycle |
| Client portal | `20260329100000_project_client_portal.sql`, `20260329140000_stakeholder_rls_isolation.sql` | `client_visible`, stakeholder RLS |
| Owner bulk RPC | `20260428110000_owner_bulk_document_decisions_rpc.sql` | Platform owner bulk decisions |

**Statuses (DB + app):** `draft | uploaded | under_review | approved | rejected | changes_requested | archived`

**Types:** `document | act | contract`

**Storage:** `object_path` → Supabase `media` bucket (public URL pattern in UI).

---

## Domain layer

| Module | Path | Role |
|--------|------|------|
| Types | `apps/web/lib/domain/documents/document.types.ts` | `ProjectDocument`, inputs, status union |
| Repository | `document.repository.ts` | CRUD, tenant-scoped |
| Service | `document.service.ts` | Authz, linkage validation, status transitions, audit |
| Policy | `document.policy.ts` | Explicit transition matrix |
| Upload path | `document-upload-path.ts` | `{tenant}/{project}/documents/{uuid}.{ext}` |
| Events | `document-event.repository.ts` | `created`, `status_changed`, etc. |
| Decision service | `document-decision.service.ts` | Bulk / owner decision helpers |

**Tests:** `document.service.test.ts`, `document.repository.test.ts`, `document.policy.test.ts`, `document-upload-path.test.ts`, `document-event.repository.test.ts`

---

## API routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/v1/projects/[id]/documents` | List / create |
| GET/PATCH | `/api/v1/projects/[id]/documents/[documentId]` | Read / update metadata & status |
| POST | `/api/v1/projects/[id]/documents/[documentId]/upload` | File upload → `uploaded` |
| POST | `/api/v1/projects/[id]/documents/[documentId]/decision` | Approve / reject / request_changes |
| GET | `/api/v1/projects/[id]/documents/[documentId]/approval-history` | History (audit + events) |
| POST | `/api/v1/projects/[id]/documents/decisions` | Bulk decisions |
| GET | `/api/v1/portal/projects/[id]/documents` | Stakeholder-safe metadata only |

**Route tests:** `route.test.ts` siblings under each API folder; upload test includes `changes_requested` re-upload case (P1).

---

## UI surfaces

| Surface | Path | Capabilities |
|---------|------|--------------|
| Project documents tab | `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx` | Create (type/title/linkages), upload, submit for review, approve/reject/**request changes**, re-upload, history, errors |
| Approvals queue link | `DashboardApprovalsClient.tsx` | Deep link to project documents tab |
| Proof pack | `ProjectProofPackPanel.tsx` | Related export surface |
| Portal | Client portal routes | Metadata only when `client_visible`; no internal paths |

---

## Status lifecycle (policy-enforced)

```
draft ──upload──► uploaded ──submit──► under_review
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
               approved                  rejected              changes_requested
                    │                         │                         │
                    └──────── archived ◄──────┴─────────────────────────┘
                                              │
                         re-upload / resubmit ▼
                                    uploaded | under_review
```

Implemented in `validateDocumentStatusTransition()` — prevents skip transitions (e.g. `uploaded → approved`).

---

## Role / tenant enforcement

- **Create / upload / review:** `canManageProjects(ctx)` in service + routes.
- **Read:** `canReadProjects(ctx)`.
- **RLS:** `project_documents_tenant` policy on table.
- **Portal:** Separate service; finance keys stripped; stakeholder role gated.

---

## What exists / works / partial / missing

### Exists & works (pilot-ready)

- Unified table for document / act / contract
- Manager create with project linkage by default
- Optional `report_id`, `task_id`, `milestone_id` on create/update (validated same tenant/project)
- Upload binds `object_path`; failed DB update rolls back storage object
- UI shows type, title, status, linkages, upload state, API errors
- Review: under_review → approved | rejected | changes_requested (with comment)
- Document events + audit on transitions
- Manager unified queue includes `under_review` and `changes_requested` documents

### Partial (non-blocking for pilot)

- **`client_visible` toggle:** API field exists; no manager UI toggle (P2)
- **DELETE document:** Not implemented (archive only)
- **`packages/contracts`:** No shared OpenAPI/JSON schema export for documents
- **Owner bulk decision RPC** vs manager PATCH: authority model differs (owner routes stricter)

### Missing (P2 backlog)

- Full ECM versioning, legal automation, OCR
- Document DELETE endpoint
- Dedicated Playwright E2E for full document manager flow

---

## Recommended minimal closure path (executed in P1)

1. ✅ Allow upload in `changes_requested` + remove stale storage object on re-upload
2. ✅ Add **Request changes** action + comment modal in `ProjectDocumentsPanel`
3. ✅ Fix manager queue / project summary counts (report project_id enrichment)
4. ✅ Wire `report_approval_events` on report review/submit paths (approvals stream)
5. ⏭ P2: `client_visible` UI, document DELETE, contracts package schemas, Playwright E2E

---

## Key files index

```
apps/web/lib/domain/documents/*
apps/web/app/api/v1/projects/[id]/documents/**
apps/web/app/api/v1/portal/projects/[id]/documents/**
apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDocumentsPanel.tsx
apps/web/supabase/migrations/20260307400000_project_documents.sql
apps/web/supabase/migrations/20260328200000_project_document_events.sql
```

**Task A verdict:** **FULL** — inventory complete; no implementation started before this document.
