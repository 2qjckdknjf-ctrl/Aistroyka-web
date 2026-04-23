# Wave 4 Step 13 — Backend report

## Schema

- **Migration**: `apps/web/supabase/migrations/20260404120000_project_defects.sql`  
- **Tables**: `project_defects`, `project_defect_events`.  
- **RLS**: Select — internal tenant reader **or** portal stakeholder for project. Write — internal. Insert — additional policy for stakeholders (open, `assigned_to` null, `created_by = auth.uid()`). Events insert — **internal only** (stakeholder creates do not write events at DB level; acceptable for MVP).

## Domain

- `apps/web/lib/domain/defects/` — `defects.types.ts`, `defects.policy.ts`, `defects.repository.ts`, `defects.service.ts`.

## API

| Route | Methods | Notes |
|-------|---------|--------|
| `/api/v1/projects/[id]/defects` | GET, POST | POST branches manager vs stakeholder via policy. |
| `/api/v1/projects/[id]/defects/[defectId]` | GET, PATCH | GET returns full row + events for managers; **public** shape for stakeholders. |
| `/api/v1/projects/[id]/defects/[defectId]/transition` | POST | Valid transitions + resolution note when moving to `resolved`. |

## Auth / tenant

- All operations scoped by tenant and project membership / portal policies (`canManageDefects` ≈ manage client requests; `canReadDefects` = manage **or** portal read; stakeholder report = portal read).

## Handover integration

- `lib/domain/project-handover/handover-readiness.ts` calls `countBlockingOpen` and emits blocker `blocking_punch_defects` with `href` to `?tab=defects`.

## Risks / follow-ups

- Apply migration in Supabase before production use.  
- Stakeholder create path does not append `project_defect_events` (RLS); manager transitions do.
