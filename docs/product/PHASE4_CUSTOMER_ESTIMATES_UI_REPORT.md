# Phase 4 Customer Estimates UI Report

Date: 2026-05-07

Roadmap phase: 4 - Customer Estimates / Commercial Approvals

## Manager UI

Added `CustomerEstimatesManagerPanel` to the project Estimate tab.

Managers can:

- create customer-facing estimate drafts,
- set title, description, total amount, currency, valid-until date,
- send draft estimates for customer approval.

The panel is visually separated from the existing internal/AI estimate analysis and labels the flow as customer-facing proposals.

## Customer UI

Customer portal already displays customer-facing commercial/payment records. Approved estimates are materialized into `project_commercial_items` with customer-visible status `issued`, so they appear in the customer portal commercial section.

## Validation

Focused:

```text
PHASE4_FOCUSED_STATUS focused=0 lint=0
```

Full validation:

```text
PHASE4_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 4 Verdict

PHASE 4 CLOSED: YES

