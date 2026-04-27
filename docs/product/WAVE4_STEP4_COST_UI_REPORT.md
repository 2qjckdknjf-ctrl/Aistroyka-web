# Wave 4 Step 4 — Manager UI (Stage D)

## Surfaces

| Surface | Location | Behavior |
|--------|----------|------------|
| **Costs tab** | `ProjectCostsPanel` | Summary cards (planned, actual, status, count); **Cost signals** list when `summary.signals.length > 0`; table with per-line overrun styling; create/edit modals; optional milestone link |
| **Project overview** | `DashboardProjectDetailClient` | **Budget** summary card: actual/planned, state text (over / near / line overruns / within), link to Costs tab |
| **Workload & governance** | Same client | Attention rows for `budget_over_project`, `budget_near_limit`, `cost_line_overruns` with **Open →** to `?tab=costs` |

## Principles

- Incremental: seventh summary card; `xl:grid-cols-7` on large screens.
- Explicit colors: error for over planned total, warning for near limit or line overruns.

## Limitations

- No org-wide cost cockpit beyond existing portfolio summary.
- No charts or exports in this step.
