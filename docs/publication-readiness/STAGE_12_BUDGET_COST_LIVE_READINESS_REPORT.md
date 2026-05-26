# STAGE 12 — Budget / Cost Layer Live Readiness Report

## 1. Goal

Validate budget/cost layer readiness at repo level, strengthen API coverage, and classify live DB parity truthfully.

## 2. Files inspected

- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectCostsPanel.tsx`
- `apps/web/app/api/v1/projects/[id]/costs/route.ts`
- `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.ts`
- `apps/web/lib/domain/costs/cost.service.ts`
- `apps/web/lib/domain/costs/cost.repository.ts`
- `apps/web/lib/domain/costs/cost-signals.ts`
- `apps/web/lib/domain/costs/*.test.ts`

## 3. Findings

1. Cost UI already supports manager-ready CRUD flow:
   - list items
   - create cost item
   - edit planned/actual/category/status/milestone
   - summary cards with over-budget and variance signal
   - empty and error states
2. Route/service layer enforces tenant/project boundaries and role checks (`canReadProjects`/`canManageProjects`).
3. Existing tests covered service and base route, but item-level route coverage was missing.

## 4. Changes made

1. Added item-level cost route tests:
   - `apps/web/app/api/v1/projects/[id]/costs/[costItemId]/route.test.ts`
   - covers:
     - detail read
     - wrong tenant/project scope (404)
     - denied update (403)
     - planned/actual/status update path

## 5. Validation commands

```bash
bun run --cwd apps/web test "app/api/v1/projects/[id]/costs/route.test.ts" "app/api/v1/projects/[id]/costs/[costItemId]/route.test.ts" lib/domain/costs/cost.service.test.ts lib/domain/costs/cost.repository.test.ts lib/domain/costs/cost-signals.test.ts
supabase --version
supabase migration list --workdir apps/web
supabase db push --dry-run --workdir apps/web
```

## 6. Validation result

- Cost-layer test suite passed (`28/28`).
- Supabase CLI present (`2.75.0`) but remote migration operations are still blocked by missing authenticated DB password/context.

## 7. Live DB parity blocker (external)

Current failure:

- `unexpected login role status 401`
- `Connect to your database by setting the env var: SUPABASE_DB_PASSWORD`

Required operator commands:

```bash
supabase login
supabase link --workdir apps/web --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<db_password>'
supabase migration list --workdir apps/web
supabase db push --dry-run --workdir apps/web
```

SQL verification query (run against target DB):

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('project_cost_items', 'project_milestones')
order by table_name;
```

## 8. Stage verdict

PARTIAL (repo-level readiness strong; live Supabase parity remains BLOCKED_EXTERNAL).

