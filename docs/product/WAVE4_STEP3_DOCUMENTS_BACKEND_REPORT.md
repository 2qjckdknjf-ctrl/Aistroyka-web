# Wave 4 Step 3 — Backend report

## B1. Persistence

| Concern | Implementation |
|--------|------------------|
| Core rows | `project_documents` — id, tenant_id, project_id, type, title, description, status, object_path, optional links, timestamps, created_by, decision fields |
| Lifecycle events | `project_document_events` — append-only rows: event_type, actor_user_id, note, created_at; RLS tenant-scoped SELECT/INSERT |

## B2. Services and repositories

- **`document.repository.ts`** — CRUD scoped by `tenant_id` / `project_id`.
- **`document.service.ts`** — `listDocuments`, `getDocumentById`, `createDocument`, `updateDocument`; emits `audit_logs` on status transitions and **`insertDocumentEvent`** for matching event types; notifications on submit/resubmit.
- **`document-decision.service.ts`** — `performOwnerDecision` (under_review → outcome); audit + **`insertDocumentEvent`** with note.
- **`document-event.repository.ts`** — `insertDocumentEvent`, `listDocumentEvents`.

## B3. API routes (v1)

- `GET/POST /api/v1/projects/[id]/documents`
- `GET/PATCH /api/v1/projects/[id]/documents/[documentId]`
- `POST .../upload` — register file + transition to `uploaded` where applicable
- `POST .../decision` — owner decision
- `GET .../approval-history` — prefers `project_document_events`; falls back to `audit_logs` legacy shape when no rows

## B4. Tenant scope and auth

- Routes use `getTenantContextFromRequest` + `requireTenant` and `canReadProjects` / `canManageProjects` consistent with other project APIs.
- RLS on `project_document_events` restricts to `tenant_members` for the same tenant.

## B5. Non-regression

- Report and milestone routes untouched except shared summary/attention wiring documented in integration report.
- Report approval flows remain independent; documents only reuse notification and audit patterns.

## B6. Operational note

Apply migration `apps/web/supabase/migrations/20260328200000_project_document_events.sql` to each Supabase environment before relying on event-backed history in production.
