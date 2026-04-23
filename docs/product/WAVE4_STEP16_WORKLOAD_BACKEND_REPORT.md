# Wave 4 Step 16 — Workload read model (backend)

## B1 — Shape

Implemented in `apps/web/lib/domain/workload/workload.types.ts`:

- **id**: deterministic string per aggregate row (e.g. `manager:overdue_milestones:{projectId}`)
- **audience**: `manager` | `stakeholder` | `leadership`
- **kind**: union covering reports queue, documents, milestones, defects, aftercare, discussions, handover, budget, portfolio, client requests
- **priority**: `urgent` | `high` | `normal`
- **title**, **reason**: human-readable
- **project_id** / **project_name**
- **linked_entity_type** / **linked_entity_id**: optional (e.g. discussion id)
- **action_url**: path to dashboard / client portal / portfolio href
- **due_state**, **status_bucket**

`WorkloadInboxResult`: `items`, per-priority `counts`, `audience`.

## B2 — Aggregation (`workload.service.ts`)

- **Manager**: `listInternalProjects` (membership or tenant-wide for owner/admin) → parallel `getProjectSummary` per project, `discussionsGrouped(..., awaiting_manager)`, `aftercareCountsByProject`. Emits per-project items plus one **tenant-level** item for pending field reports → `/dashboard/approvals`.
- **Stakeholder**: `listActiveProjectIdsForUser` + `listByIds` → `clientRequestsOpenGrouped`, `discussionsGrouped(..., awaiting_stakeholder)`.
- **Leadership**: `buildPortfolioControl` → one item per project with `portfolioState === "critical"`, links use `row.projectHref`.

## B3 — Read-only

No new tables; pure read model over Supabase + existing domain services. Sorting: priority then title.

## Limits

- `MAX_PROJECTS = 25` per build to bound query cost.
- Manager path uses `computeHandoverReadinessFromSummary` per project (N summaries + N handover computations).
