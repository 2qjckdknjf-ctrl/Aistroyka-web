# Phase 2 Customer Finance Isolation Report

Date: 2026-05-07

Roadmap phase: 2 - Owner / Customer Portal

## Rule

Customer / owner must never see internal financial state of the construction company.

Customer may see only intentionally customer-facing commercial information:

- estimates or proposals sent to the customer,
- approved commercial changes,
- payment schedule or invoices if configured,
- decisions that depend on the customer.

## What Was Checked

Code surfaces:

- `apps/web/lib/domain/client-portal/client-portal.service.ts`
- `apps/web/lib/domain/client-portal/client-portal.types.ts`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalViewClient.tsx`
- `apps/web/lib/domain/change-orders/change-orders.policy.ts`
- `apps/web/lib/domain/costs/cost.service.test.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.test.ts`

Database/RLS:

- `project_commercial_items`
- `project_commercial_item_events`
- `project_cost_items`

## Isolation Controls

- Client portal read model does not include `planned_total`, `actual_total`, `over_budget`, or internal cost item rows.
- Internal cost service rejects portal/customer roles when they do not have internal project read permissions.
- Commercial records exposed to customer are a separate explicit projection from `project_commercial_items`.
- Customer commercial record payload omits `created_by` and event history.
- Commercial events are internal-only by RLS.
- Change order public access is mediated through `canReadClientPortalView`.

## Customer-Facing Commercial Records

Allowed statuses:

```text
issued
due
overdue
paid
```

Excluded statuses include draft/cancelled/internal lifecycle states.

## Live Supabase Status

Live `project_commercial_items` portal policy:

```sql
is_portal_stakeholder_for_project(project_id)
and status in ('issued', 'due', 'overdue', 'paid')
```

Live `project_commercial_item_events` policies:

```text
select: internal tenant reader only
insert: internal tenant reader only
```

## Verdict

Customer finance isolation passed for Phase 2.

Validation:

```text
Focused: 4 test files passed, 19 tests passed
PHASE2_FULL_STATUS test=0 build=0 cfbuild=0
```

PHASE 2 CLOSED: YES

