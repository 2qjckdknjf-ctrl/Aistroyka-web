# Step 12 — Document Domain Model

**Date:** 2026-03-18

## 1. Target entity/entities

**Primary target:** `public.project_documents`

This single entity models all three artifact types:
- `type`: `document | act | contract`

## 2. Core fields

- `id`: document id
- `tenant_id`: tenant boundary
- `project_id`: project linkage
- `type`: artifact type (`document | act | contract`)
- `title`: required
- `description`: optional notes
- `status`: explicit lifecycle state
- `object_path`: storage reference to the uploaded file
- `created_by`: creator
- optional linkage (only stored; no fabricated drill-down):
  - `report_id` → `public.worker_reports`
  - `task_id` → `public.worker_tasks`
  - `milestone_id` → `public.project_milestones`
- `created_at`, `updated_at`

## 3. Status/lifecycle model (explicit, minimal)

`draft`
- Document metadata created but file not uploaded.

`uploaded`
- File uploaded to storage and document is ready for review.

`under_review`
- Manager-submitted for review; manager can approve/reject.

`approved`
- Review accepted (terminal for review cycle).

`rejected`
- Review rejected (terminal for review cycle; resubmission can be modeled later if needed).

`archived`
- Archived (terminal for visibility; UI may hide or de-emphasize).

## 4. Approval semantics (what is actually “approval”)

Approval is the manager’s transition:
- `under_review → approved` (approve)
- `under_review → rejected` (reject)

Submission for review is:
- `uploaded → under_review`

Notes:
- This phase does **not** implement a giant legal workflow or e-sign automation.
- “Changes requested” is represented by `rejected` in this minimal model (no extra taxonomy added).

## 5. Tenant boundary and visibility

All operations are tenant-scoped:
- List documents by project requires `canReadProjects`
- Create/update requires `canManageProjects`

No cross-tenant access is allowed.

