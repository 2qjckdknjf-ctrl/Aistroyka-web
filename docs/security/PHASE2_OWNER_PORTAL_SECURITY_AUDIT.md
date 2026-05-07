# Phase 2 Owner Portal Security Audit

Date: 2026-05-07

Roadmap phase: 2 - Owner / Customer Portal

## Access Model

This repo keeps platform owner access separate from customer/property-owner access:

- Platform owner: `/owner`, `/api/v1/owner/*`, platform owner grants.
- Customer portal: `/dashboard/projects/[id]/client`, `GET /api/v1/projects/:id/client-view`.

Customer portal access is granted only when:

- the user is authenticated,
- the tenant context is present,
- `projects.client_portal_enabled = true`,
- the user is a project owner member or active project stakeholder.

## Security Checks

Implemented/tested:

- Portal-only stakeholder/customer roles cannot access internal project costs through `cost.service`.
- Portal stakeholders can read change orders only through `canReadClientPortalView`.
- Customer portal payload excludes internal budget totals and cost item fields.
- Customer portal payload excludes commercial event actor history.
- Customer portal commercial records are limited to issued/customer-facing statuses.
- Manager daily action feed remains manager-only and rejects stakeholder roles.

## RLS Evidence

Live Supabase migration:

```text
20260507094409 phase2_customer_portal_commercial_rls
```

Live policies verified:

- `project_commercial_items_internal_select`
- `project_commercial_items_portal_select`
- `project_commercial_items_internal_insert`
- `project_commercial_items_internal_update`
- `project_commercial_items_internal_delete`
- `project_commercial_item_events_select_internal`
- `project_commercial_item_events_insert_internal`

Portal commercial select predicate:

```sql
is_portal_stakeholder_for_project(project_id)
and status in ('issued', 'due', 'overdue', 'paid')
```

Commercial item events are internal-only.

## Residual Risks

- The roadmap's `/owner/projects/*` route names are intentionally not used in this repo because `/owner` is platform-owner territory.
- Full browser E2E with real customer credentials is not included in this phase run.
- Future Phase 4 customer estimates should introduce explicit estimate tables/API rather than exposing internal estimate/cost analysis.

## Verdict

Access isolation tested and passed for the Phase 2 scope.

Validation:

```text
Focused: 4 test files passed, 19 tests passed
PHASE2_FULL_STATUS test=0 build=0 cfbuild=0
```

PHASE 2 CLOSED: YES

