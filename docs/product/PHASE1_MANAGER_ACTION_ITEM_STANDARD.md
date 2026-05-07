# Phase 1 Manager Action Item Standard

Date: 2026-05-07

Roadmap phase: 1 - Manager Daily Control Center

## Purpose

`ManagerActionItem` is the canonical manager-only action shape for answering:

> What needs attention today?

It is a read model. It does not create tasks, fake recommendations, or expose customer-facing data.

## Contract

```ts
type ManagerActionItem = {
  id: string;
  type:
    | "missing_evidence"
    | "overdue_task"
    | "milestone_at_risk"
    | "approval_pending"
    | "document_review"
    | "internal_cost_overrun"
    | "customer_estimate_pending"
    | "customer_decision_pending"
    | "upload_problem"
    | "ai_risk"
    | "system_alert";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  reason: string;
  project_id: string;
  project_name?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  href: string;
  recommended_action: string;
  visibility: "internal_manager_only";
  created_at?: string;
};
```

## Current Signal Sources

The first implementation intentionally reuses existing real operational signals from `buildManagerWorkload`:

- pending report approvals
- pending document decisions
- overdue milestones
- internal budget over planned
- blocking punch defects
- open aftercare/service requests
- stakeholder discussions awaiting manager
- handover readiness blockers
- recurring operational nudges
- governance and portfolio workload signals

## Finance Isolation

Internal finance signals are allowed only because this route is manager-only.

Rules:

- Every action has `visibility: "internal_manager_only"`.
- `internal_cost_overrun` links only to the internal project Costs tab.
- Owner/customer/client/stakeholder routes must not call `/api/v1/dashboard/manager-actions`.
- The API rejects portal-only stakeholder roles with `403`.

## API

```text
GET /api/v1/dashboard/manager-actions
```

Response:

```ts
{
  data: {
    items: ManagerActionItem[];
    counts: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}
```

Limits:

- returns at most 20 items
- sorted upstream by workload priority and title
- no fake fallback actions

## Validation

Focused tests:

- `apps/web/lib/domain/dashboard/manager-actions.service.test.ts`
- `apps/web/app/api/v1/dashboard/manager-actions/route.test.ts`

Actual focused result:

```text
2 test files passed
4 tests passed
```

Full Phase 1 validation:

```text
PHASE1_FULL_STATUS test=0 build=0 cfbuild=0
```

