# Step 14 — Budget / Cost Domain Model

## 1. Design principle

- **No separate "project budget" row.** Budget is the aggregate view of non-archived cost items for a project. One source of truth: project_cost_items.
- **Explicit planned vs actual.** Every line item has planned_amount and actual_amount; summary has planned_total, actual_total, variance_amount, over_budget.
- **No accounting ledger, no invoice/payment engine.** Minimal justified model for manager cost visibility.

## 2. Chosen entities

| Entity | Table | Purpose |
|--------|--------|--------|
| Cost item | project_cost_items | One line item: category, title, planned_amount, actual_amount, currency, status, optional milestone link, notes, audit (created_by, timestamps). |
| Budget summary | Derived (not stored) | planned_total, actual_total, variance_amount, currency, over_budget, item_count. Computed from non-archived cost items. |

## 3. Attributes

**project_cost_items:**

- id, tenant_id, project_id — identity and scope.
- category — one of: materials, labor, equipment, services, other.
- title — free text.
- planned_amount, actual_amount — numeric(14,2), >= 0.
- currency — text, default RUB.
- status — planned | committed | incurred | approved | archived. Archived items excluded from summary.
- notes — optional text.
- milestone_id — optional FK to project_milestones.
- created_by — user who created; updated_at via trigger.

**ProjectBudgetSummary (derived):**

- project_id, tenant_id, planned_total, actual_total, variance_amount (actual − planned), currency, over_budget (actual_total > planned_total), item_count.

## 4. Categories

- materials, labor, equipment, services, other. Validated in cost.service; stored as-is.

## 5. What we do not introduce

- No project_budget table.
- No invoice, payment, or commitment ledger.
- No multi-currency conversion; one currency per item/summary.
- No task- or report-level cost attribution in this model (optional future extension).

## 6. Remaining gaps

- No "estimated" amount separate from planned (planned is the budget line; actual is recorded spend).
- No approval workflow for cost changes; governance linkage is lightweight (see STEP14_BUDGET_GOVERNANCE_LINKAGE.md).
- Currency is per item; mixed-currency projects show one currency in summary (first item’s currency used for summary label; totals are summed as numbers).
