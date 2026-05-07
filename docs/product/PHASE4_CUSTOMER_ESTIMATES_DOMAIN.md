# Phase 4 Customer Estimates Domain

Date: 2026-05-07

Roadmap phase: 4 - Customer Estimates / Commercial Approvals

## Domain

Added explicit customer-facing estimate tables:

- `customer_estimates`
- `customer_estimate_items`

These tables are separate from:

- `project_cost_items`
- `project_estimate_results`
- internal budget summaries

## Workflow

Manager:

1. Create draft estimate.
2. Send estimate to customer.
3. Sending creates linked decision request with `decision_type = estimate_approval`.

Customer:

1. Reads sent estimates through customer-safe APIs.
2. Approves or rejects.
3. Approval updates estimate state and creates a customer-facing commercial item.

## APIs

```text
GET /api/v1/projects/:id/estimates
POST /api/v1/projects/:id/estimates
POST /api/v1/projects/:id/estimates/:estimateId/send
POST /api/v1/projects/:id/estimates/:estimateId/respond
```

Customer-safe listing uses:

```text
GET /api/v1/projects/:id/estimates?viewer=customer
```

## Finance Isolation

Customer estimates expose only explicit commercial fields:

- title
- description
- total amount
- currency
- validity
- customer status

They do not expose internal actual cost, planned internal cost, margin, cost overrun, subcontractor cost, or internal cost item details.

## Validation

Focused:

```text
PHASE4_FOCUSED_STATUS focused=0 lint=0
```

Full validation:

```text
Full tests: 252 test files passed, 1370 tests passed
PHASE4_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 4 Verdict

PHASE 4 CLOSED: YES

