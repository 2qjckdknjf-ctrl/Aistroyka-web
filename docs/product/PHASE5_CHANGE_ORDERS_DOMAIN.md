# Phase 5 Change Orders Domain

Date: 2026-05-07

Roadmap phase: 5 - Change Orders / Допработы

## Domain

The repo already has `project_change_orders` and `project_change_order_events`. Phase 5 extends the model with customer-facing commercial approval fields:

- `reason`
- `customer_amount_delta`
- `currency`
- `linked_customer_estimate_id`
- `internal_cost_item_id`
- `approved_by_customer`
- `approved_at`

## Status Model

Existing statuses are retained:

- `draft`
- `proposed`
- `under_review`
- `approved`
- `rejected`
- `implemented`
- `archived`

`proposed` is the shipped equivalent of roadmap `sent_to_owner`.

## APIs

Existing:

```text
GET /api/v1/projects/:id/change-orders
POST /api/v1/projects/:id/change-orders
GET /api/v1/projects/:id/change-orders/:changeOrderId
PATCH /api/v1/projects/:id/change-orders/:changeOrderId
POST /api/v1/projects/:id/change-orders/:changeOrderId/transition
```

Added:

```text
POST /api/v1/projects/:id/change-orders/:changeOrderId/send
POST /api/v1/projects/:id/change-orders/:changeOrderId/respond
```

## Audit Trail

All state changes continue to use `project_change_order_events`.

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

