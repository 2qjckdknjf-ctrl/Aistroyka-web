# Wave 4 Step 3 — Document layer inventory

**Stage A — Document inventory (authoritative for this step)**

## A1. Existing architecture (inspected)

- **Persistence:** `public.project_documents` (Supabase migration `20260307400000_project_documents.sql`), extended with decision fields (`20260322000000_document_decision_fields.sql`).
- **Domain:** `apps/web/lib/domain/documents/*` — repository, service, policy, types, decision service.
- **API:** `/api/v1/projects/:id/documents` (list/create), `.../documents/:documentId` (read/PATCH), `.../upload`, `.../decision`, `.../approval-history`.
- **Storage:** File linkage via `object_path` and dedicated upload route aligned with existing media/upload-session patterns.
- **Approvals backbone:** `audit_logs` for governance actions; Wave 4 Step 3 adds **`project_document_events`** for tenant-visible append-only history (`20260328200000_project_document_events.sql`).

## A2. Minimal document model (chosen)

Single table **`project_documents`** with explicit **type**, **status**, **project_id**, **tenant_id**, optional **description**, **object_path**, optional **report_id** / **task_id** / **milestone_id**, **created_by**, decision metadata. No separate ECM/DMS entities.

## A3. Types (minimum set)

| Type        | Purpose                                      |
|------------|-----------------------------------------------|
| `document` | General formal project file                    |
| `act`      | Acts / acceptance-style formal artifacts       |
| `contract` | Contracts                                     |

## A4. Lifecycle / status

Aligned with `document.policy.ts` and DB checks:

`draft` → `uploaded` → `under_review` → (`approved` \| `rejected` \| `changes_requested`) → resubmit loops → `archived`.

This matches manager mental models and reuses the same review vocabulary as the report approval layer without merging schemas.

## A5. Rationale and relations

**Why this scope**

- Fits existing tenant + project scoping and `canManageProjects` / `canReadProjects` patterns.
- Avoids a second “document OS” — one row per artifact, explicit status, file pointer when present.

**Intentionally deferred**

- Budget/cost, BIM/ERP, enterprise search, legal e-sign, Android-specific document UX, full dashboard redesign.

**Relations to projects / reports / milestones**

- **Project:** required foreign key on every document.
- **Report / task / milestone:** optional FKs for traceability when the team links an artifact to field work or schedule; not required for core workflow.

---

**Output:** This file satisfies Stage A. Implementation details: Stages B–H reports in sibling `WAVE4_STEP3_DOCUMENTS_*.md` files.
