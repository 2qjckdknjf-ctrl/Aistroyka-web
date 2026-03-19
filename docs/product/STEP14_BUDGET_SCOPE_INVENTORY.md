# Step 14 — Budget / Cost Scope Inventory

## 1. Current Repo Truth

### 1.1 Existing budget/cost entities

- **project_cost_items** (migration 20260307500000): id, tenant_id, project_id, category, title, planned_amount, actual_amount, currency, status (planned|committed|incurred|approved|archived), notes, milestone_id, created_by, created_at, updated_at. RLS tenant-scoped.
- **No separate "project_budget" table.** Budget = aggregate of non-archived cost items per project (planned_total, actual_total, over_budget, item_count) computed in cost.repository getBudgetSummary().

### 1.2 Tasks / reports / documents / approvals and cost

- **Milestone linkage:** project_cost_items.milestone_id references project_milestones. No direct task/report/document FK on cost items. Approvals layer (document approval, report review) is separate; no "cost approval" workflow in repo.
- **Conclusion:** Cost is project-scoped and line-item-based; optional link to milestone. No task/report-level cost recording in current schema.

### 1.3 Project financial fields

- No project.planned_budget or project.actual_cost columns. All financial data lives in project_cost_items; summary is derived on read.

### 1.4 Manager-facing surfaces

- **Project Costs tab (Costs panel):** Summary cards (Planned total, Actual total, Status Over budget/On budget, Cost items count); table of items (title, category, planned, actual, status, linked milestone, created); "Add cost item" modal (create). **No edit/update UI** for existing items (PATCH API exists).
- **API:** GET/POST /api/v1/projects/:id/costs (list + summary, create); GET/PATCH /api/v1/projects/:id/costs/:costItemId (single item, update).

### 1.5 Cost concepts currently supported

| Concept | Supported | Notes |
|--------|-----------|--------|
| Project budget | Yes (derived) | Sum of non-archived items planned_amount / actual_amount. |
| Budget line items | Yes | project_cost_items rows. |
| Planned vs actual | Yes | planned_amount, actual_amount per item; planned_total, actual_total in summary. |
| Cost categories | Yes | materials, labor, equipment, services, other. |
| Cost status | Yes | planned, committed, incurred, approved, archived. |
| Over-budget signal | Yes | summary.over_budget (actual_total > planned_total); UI shows "Over budget" / "On budget". |
| Variance visibility | Partial | over_budget boolean; no explicit variance_amount in summary or per-item variance in UI. |
| No budget / no actuals | Partial | Empty state "No cost items yet"; no explicit "No actuals recorded yet" when planned > 0 and actual_total === 0. |

### 1.6 What must be deferred

- Market pricing engine, CAD/AutoCAD, external pricing ingestion (Step 15 / later).
- Full ERP / procurement / accounting; invoice/payment engine; multi-currency conversion.
- Cost approval workflow (e.g. require approval for cost item changes); document/act linkage to cost items beyond optional milestone.
- Task-level or report-level cost attribution (no schema for it).

---

## 2. Chosen Scope for Step 14

**Smallest high-value closure:**

1. **Keep** existing model: project_cost_items + derived summary; categories and status as-is; tenant/project enforcement.
2. **Add** explicit variance in summary (variance_amount = actual_total - planned_total) for manager clarity.
3. **Add** manager edit flow for cost items (modal or inline) so planned/actual can be updated and overrun/variance is visible without leaving the panel.
4. **Clarify** budget state in UI: no budget configured (no items); no actuals yet (items exist, all actuals 0); over budget / on budget (existing).
5. **Document** state model, domain model, governance linkage (lightweight), action integration (cost signals already in risk-intelligence).
6. **Validate** and post-audit; no new tables or speculative workflows.

---

## 3. Deferred Scope and Why

| Item | Reason |
|------|--------|
| Separate project_budget row | Budget is derived from items; one source of truth avoids drift. |
| Market/region pricing | Step 15 / product expansion. |
| Cost approval workflow | Not in minimal scope; can add later if needed. |
| Task/report cost attribution | No schema; would require design and migration. |
| Multi-currency conversion | Out of scope; single currency per item/summary. |
