# Wave 4 Step 4 — Backend report (Stage B)

## Schema (existing)

`project_cost_items`: `id`, `tenant_id`, `project_id`, `category`, `title`, `planned_amount`, `actual_amount`, `currency`, `status`, `notes`, `milestone_id`, `created_by`, timestamps.

## Services

- **`cost.repository.ts`** — `listByProject`, `getById`, `create`, `update`, **`getBudgetSummary`** (aggregates + signal inputs).
- **`cost.service.ts`** — Auth-gated CRUD and `getBudgetSummary` for API.

## `getBudgetSummary` outputs

- Totals and variance; `over_budget` (actual total > planned total).
- `utilization_ratio`, `nearing_budget_limit` (≥90% of planned total, not over).
- `item_overrun_count`, `milestone_linked_overrun_count`.
- **`signals`:** from `buildCostPressureSignals` in `cost-signals.ts`.

## Project summary integration

- **`project-summary.repository.ts`** calls `getBudgetSummary` and exposes budget fields on **`ProjectSummary`** for `/api/v1/projects/:id/summary`.

## Auth / tenant

- Same patterns as other project APIs: `canReadProjects` / `canManageProjects`; RLS on `project_cost_items`.

## Non-regression

- No changes to report approval, document, or milestone write paths beyond read-only summary aggregation.
