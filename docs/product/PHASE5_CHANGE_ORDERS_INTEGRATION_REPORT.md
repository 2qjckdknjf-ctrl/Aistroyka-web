# Phase 5 Change Orders Integration Report

Date: 2026-05-07

Roadmap phase: 5 - Change Orders / Допработы

## Manager Flow

Managers can create change orders from the existing project change order panel and API.

Phase 5 adds:

- customer-facing commercial amount field support,
- send route to move draft to proposed,
- customer response route to approve/reject.

## Customer Flow

Customer portal can view sanitized change order details.

Customer-visible fields include:

- title
- description
- schedule impact summary
- schedule delta days
- customer commercial amount
- status history without manager-only notes

Customer does not receive:

- internal budget impact fields
- internal budget amount fields
- `internal_cost_item_id`
- manager notes or actor ids

## Commercial Integration

When a customer approves a change order with `customer_amount_delta`, the system creates a customer-facing `project_commercial_items` row with status `issued`.

This is commercial revenue/payment tracking, not internal implementation cost.

## Validation

Focused:

```text
PHASE5_FOCUSED_STATUS focused=0 lint=0
```

Full validation:

```text
PHASE5_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 5 Verdict

PHASE 5 CLOSED: YES

