# Phase 2 Owner / Customer Portal Completion Report

Date: 2026-05-07

Roadmap phase: 2 - Owner / Customer Portal

## Scope

Phase 2 continues the existing customer portal instead of reusing `/owner`, because this repo already uses `/owner` and `/api/v1/owner/*` for the platform owner cabinet.

Customer-facing surface:

- UI: `/dashboard/projects/[id]/client`
- API: `GET /api/v1/projects/:id/client-view`
- Existing customer action APIs: client requests, discussions, defects, service requests, sanitized change orders

## Implemented

- Added customer-facing commercial/payment records to the client portal read model.
- Rendered commercial records in `ClientPortalViewClient`.
- Restricted commercial records to customer-visible statuses only: `issued`, `due`, `overdue`, `paid`.
- Kept internal commercial event actor history out of the customer payload.
- Allowed portal stakeholders to read sanitized change orders through the existing client portal policy, not through internal project read access.
- Preserved the Phase 0 finance isolation fix: no internal budget totals, actual costs, over-budget flags, or cost items in the client portal.
- Added Supabase RLS hardening for `project_commercial_items` and `project_commercial_item_events`.

## Customer Can See

- project name and progress totals
- customer-visible milestones
- customer-visible document metadata
- visible document decisions
- client requests
- sanitized change orders
- customer-facing commercial/payment records
- handover status and notes

## Customer Cannot See

- internal cost items
- internal planned-vs-actual budget totals
- actual company costs
- over-budget flags
- margin or profitability
- subcontractor costs
- internal AI diagnostics or finance risk
- commercial item event actor history
- manager action feed
- platform owner cabinet data

## Validation

Focused tests to run:

```bash
bun run --cwd apps/web test \
  "lib/domain/client-portal/client-portal.service.test.ts" \
  "lib/domain/change-orders/change-orders.policy.test.ts" \
  "lib/domain/costs/cost.service.test.ts" \
  "app/api/v1/projects/[id]/client-view/route.test.ts"
```

Full validation to run:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

Actual result:

```text
Focused: 4 test files passed, 19 tests passed
Lint: No ESLint warnings or errors
Full validation: PHASE2_FULL_STATUS test=0 build=0 cfbuild=0
```

## Verdict

Customer portal works through the existing `/dashboard/projects/[id]/client` surface, access isolation is tested, customer-safe commercial records are visible, and internal finance remains isolated.

PHASE 2 CLOSED: YES

