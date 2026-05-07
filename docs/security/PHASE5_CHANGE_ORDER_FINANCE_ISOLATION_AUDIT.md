# Phase 5 Change Order Finance Isolation Audit

Date: 2026-05-07

Roadmap phase: 5 - Change Orders / Допработы

## Rule

Customer may see the approved commercial change amount. Customer must not see internal implementation cost, margin, profit, budget pressure, or internal cost item details.

## Implemented Controls

- Added explicit `customer_amount_delta` and `currency`.
- Added `internal_cost_item_id` as manager-only linkage.
- Public change order detail includes `customer_amount_delta`.
- Public change order detail excludes:
  - `budget_impact_level`
  - `budget_impact_summary`
  - `budget_delta_amount`
  - `internal_cost_item_id`
  - manager-only event notes
  - actor ids
- Customer approval creates customer-facing commercial item, not internal cost item.

## Live Supabase

Migration applied:

```text
phase5_change_order_commercial_approval
```

Verified live columns:

- `customer_amount_delta`
- `currency`
- `internal_cost_item_id`
- `approved_by_customer`
- `approved_at`

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

