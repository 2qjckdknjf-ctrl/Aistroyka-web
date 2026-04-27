# Wave 4 Step 4 — Cost inventory (Stage A)

## A1. Architecture inspected

- **Persistence:** `public.project_cost_items` (`20260307500000_project_cost_items.sql`) — tenant-scoped RLS; planned/actual amounts; optional `milestone_id`; statuses `planned` → `archived`.
- **Domain:** `apps/web/lib/domain/costs/*` — repository, service, types; aggregates in `getBudgetSummary`.
- **API:** `GET/POST /api/v1/projects/:id/costs`, `GET/PATCH .../costs/:costItemId`.
- **UI:** `ProjectCostsPanel` on project detail `?tab=costs`; portfolio command view already surfaces over-budget projects.

## A2. Minimal cost model (chosen)

Single table of **cost line items** per project with **planned vs actual**, **category**, **status**, optional **milestone** link. **Project-level budget** = sum of non-archived lines; pressure = comparison of totals and per-line overruns.

## A3. What exists in this step

| Element | Included |
|--------|----------|
| Project-level totals | Planned total, actual total, variance |
| Cost items | Title, category, amounts, status, optional milestone |
| Signals | Project over planned total; ≥90% utilization (nearing); line-level overrun; milestone-linked overrun |
| Manager surfaces | Costs tab, summary budget card, workload signals with link to costs |

## A4. Rationale and deferrals

**Why this scope:** Matches manager need (“are we over?”) without ERP ledgers, tax, or procurement.

**Deferred:** Invoicing, accounting periods, multi-currency FX, ERP adapters, purchase orders, tax, procurement automation, Android-specific cost UX, full dashboard redesign.

**Relations:** Costs belong to **projects**; optional **milestone_id** links a line to schedule for explainability, not double-entry.
