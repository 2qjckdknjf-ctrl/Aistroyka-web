# P1 — Document Create / Upload / Link Flow Closure

**Date:** 2026-07-02  
**Area:** Task B — manager document create, upload, linkage  
**Verdict:** **FULL** for pilot operations

---

## Required capabilities checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Manager can create document / act / contract | ✅ FULL | `POST /api/v1/projects/[id]/documents`; UI type selector in `ProjectDocumentsPanel.tsx` |
| 2 | Manager can upload file | ✅ FULL | `POST .../documents/[documentId]/upload` |
| 3 | File linked to document metadata | ✅ FULL | Updates `object_path`; returns `file_url` |
| 4 | Document linked to project by default | ✅ FULL | `project_id` required on create |
| 5 | Optional report_id / task_id / milestone_id | ✅ FULL | Create + PATCH; `validateDocumentLinkages()` in `document.service.ts` |
| 6 | UI shows type, title, status, linked entity, upload state, errors | ✅ FULL | Table + modals in `ProjectDocumentsPanel.tsx`; `translateApiError()` |
| 7 | No orphan success if upload fails | ✅ FULL | Storage rollback on upload/DB failure; 500 if update fails after upload |

---

## Implementation notes

### Create flow

- New documents **must** start `draft` (service rejects other initial statuses).
- Types: `document | act | contract`.
- Auth: `canManageProjects`.

### Upload flow

- Allowed statuses: **`draft`** and **`changes_requested`** (P1 extension).
- Max 25 MB; `media` bucket; path via `buildDocumentUploadObjectPath()`.
- On re-upload: previous `object_path` removed from storage when replaced.
- Success sets status → **`uploaded`**.

### Linkage validation

Same-tenant checks for report, task, milestone; report/task/milestone must belong to the document's project.

---

## Tests

| Test | Path |
|------|------|
| Document service CRUD | `document.service.test.ts` |
| Upload route (draft + changes_requested) | `upload/route.test.ts` |
| Upload path builder | `document-upload-path.test.ts` |
| Documents list/create API | `documents/route.test.ts` |

---

## Gaps (non-blocking)

| Gap | Classification |
|-----|----------------|
| No `client_visible` toggle in UI | P2 backlog |
| No DELETE | P2 backlog |
| No Playwright E2E for create/upload | P2 backlog |

---

## Closure verdict

**FULL** — Manager create/upload/link flow is operational for pilot. No P1 blockers.
