# Phase 1 Manager Daily Control Center

Date: 2026-05-07

Roadmap phase: 1 - Manager Daily Control Center

## Goal

Give managers one prioritized dashboard block that answers:

> What is burning today and what should I do first?

## Implemented Scope

Added manager-only action aggregation:

- service: `apps/web/lib/domain/dashboard/manager-actions.service.ts`
- API: `GET /api/v1/dashboard/manager-actions`
- UI block: dashboard section titled `What needs attention today`
- i18n copy for `en`, `ru`, `es`, `it`
- focused service and API tests

## Data Sources

The implementation uses existing real data via `buildManagerWorkload`, including:

- pending approvals
- document review decisions
- schedule/milestone overdue state
- internal cost over-planned signals
- punch list and handover blockers
- aftercare/service request follow-up
- stakeholder discussions awaiting manager
- recurring operational automation nudges

No placeholder or fake recommendations were added.

## Security And Finance Isolation

The action feed is internal manager-only:

- route checks tenant context and requires `canManageProjects`
- portal-only stakeholder/customer roles receive `403`
- every item has `visibility: "internal_manager_only"`
- internal finance actions are typed as `internal_cost_overrun`
- owner/customer UI does not consume this route

This preserves the roadmap rule: customer/owner surfaces must not see internal costs, budget pressure, cost overruns, margin, profitability, subcontractor costs, or internal AI finance risk.

## UI Behavior

The dashboard now shows a card after the ops overview:

```text
What needs attention today
```

For each item it shows:

- title
- reason
- recommended action
- severity styling
- drill-down link
- internal-only finance label when applicable

## Validation Plan

Run:

```bash
bun run --cwd apps/web test \
  "lib/domain/dashboard/manager-actions.service.test.ts" \
  "app/api/v1/dashboard/manager-actions/route.test.ts"
bun run lint
bun run test
bun run build
bun run cf:build
```

Actual result:

```text
Focused: 2 test files passed, 4 tests passed
Lint: No ESLint warnings or errors
Full tests: 249 test files passed, 1363 tests passed
Build: PASS
Cloudflare build: PASS
PHASE1_FULL_STATUS test=0 build=0 cfbuild=0
```

## Closure Criteria

- Manager sees prioritized action list: implemented.
- Internal finance actions are manager-only: implemented.
- Route is protected: implemented and tested.
- No owner/customer access to manager feed: implemented and tested via stakeholder rejection.
- Tests/build: passed.

## Phase 1 Verdict

PHASE 1 CLOSED: YES

