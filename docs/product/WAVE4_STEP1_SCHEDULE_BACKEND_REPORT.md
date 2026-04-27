# Wave 4 Step 1 — Backend report (Stage B)

## Schema

### Tables

- **`project_milestones`** — canonical milestone rows (see inventory doc).
- **`worker_tasks.milestone_id`** — optional link to a milestone.

### Migration

- **`apps/web/supabase/migrations/20260328120000_wave4_milestone_status.sql`**
  - Maps legacy: `pending`→`planned`, `done`→`completed`, `cancelled`→`archived`.
  - CHECK: `planned` | `in_progress` | `completed` | `delayed` | `archived`.
  - Default `planned`.

**Deploy note:** Apply this migration to Supabase before relying on new status values in production.

## Domain layer

| Module | Responsibility |
|--------|----------------|
| `lib/domain/milestones/milestone.types.ts` | `Milestone`, `MilestoneStatus`, create/update inputs |
| `lib/domain/milestones/milestone.repository.ts` | CRUD, list by project, **countLinkedTasks** (total + done by `worker_tasks.status === 'done'`) |
| `lib/domain/milestones/milestone.service.ts` | Auth (`canReadProjects` / `canManageProjects`), **`listMilestones`** → **`MilestoneWithSchedule`** |
| `lib/domain/milestones/milestone.schedule.ts` | Pure **schedule signal** builders (no DB) |

## API routes

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/projects/[id]/milestones` | List milestones with enriched fields (see signals report) |
| POST | same | Create milestone; optional `status` must be new enum |
| GET/PATCH | `/api/v1/projects/[id]/milestones/[milestoneId]` | Read/update milestone |

Task linkage remains on **task** endpoints (`milestone_id` on worker/manager task payloads) — not duplicated on milestone routes.

## Project summary

- **`lib/domain/projects/project-summary.repository.ts`**
  - **`overdueMilestonesCount`:** count rows where `target_date < today` and `status in ('planned','in_progress','delayed')`.

## Auth / tenant

- Milestone routes use `getTenantContextFromRequest` + `requireTenant`.
- Services enforce tenant via `getProjectById` / repository filters on `tenant_id`.
- RLS policies on `project_milestones` unchanged (tenant membership).

## Risks

1. **Migration order:** environments still on old enum will fail API validation until migrated.
2. **N+1 on list:** `listMilestones` loads linked task counts per milestone (acceptable for typical small milestone sets; optimize later if needed).
