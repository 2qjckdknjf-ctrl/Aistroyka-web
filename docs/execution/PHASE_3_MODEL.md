# Phase 3 — Semantic Model (Budget / Cost Activation)

**Date:** 2026-04-18  
**Stage:** B — Semantic Model

## Target Behavior

Phase 3 closes one coherent financial control loop:

1. Manager records and updates project cost lines (`planned` vs `actual`).
2. System emits explainable pressure signals from aggregate budget state.
3. Manager creates and transitions change orders with explicit status history.
4. Manager creates commercial items linked to approved/active change context.
5. Commercial items progress through billing lifecycle to payment closure.

## Cost Model

- Entity: `project_cost_items`
- Budget aggregate: project-level summary over non-archived lines.
- Derived fields:
  - `planned_total`, `actual_total`, `variance_amount`
  - `over_budget`, `utilization_ratio`, `nearing_budget_limit`
  - `item_overrun_count`, `milestone_linked_overrun_count`
  - `signals[]` (deterministic, explainable)

## Change-Order Model

- Entity: `project_change_orders`
- Event entity: `project_change_order_events`
- State machine:
  - `draft -> proposed -> under_review -> approved -> implemented -> archived`
  - rejection and rollback branches are explicitly controlled by allowed transitions.

## Commercial Model

- Entity: `project_commercial_items`
- Event entity: `project_commercial_item_events`
- State machine:
  - `draft -> issued -> due -> overdue -> paid` (or cancellation path)
- Optional linkage:
  - `linked_change_order_id`
  - `linked_document_id`

## Closure Criteria (Phase 3)

Phase 3 is `YES` only if:

1. Cost API runtime supports create/read/update with budget summary and signals.
2. Change-order API runtime supports create, content update, and transitions with event trail.
3. Commercial API runtime supports create, status progression, and linkage to change-order.
4. Live matrix proves manager loop end-to-end without unresolved blockers.
