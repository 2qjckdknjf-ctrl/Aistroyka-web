# Wave 4 Step 4 — Integration (Stage E)

## Project detail

- **GET `/api/v1/projects/:id/summary`** includes budget aggregates and `budgetSignals`.
- **`deriveProjectStatus`** receives `budgetOverBudget`, `budgetNearingLimit`, `costLineOverrunCount`, `budgetItemCount` and adds attention items + status reasons when relevant.

## Truth snapshot (AI Brain Phase A)

- **`assembleProjectTruthSnapshot`** passes budget fields into `deriveProjectStatus`.
- **`dataSufficiencyFlags.budget`:** `unavailable` if no cost lines; `full` if lines exist and no pressure; `partial` if over budget or line overruns.
- **`budgetPressure`:** `{ available, overBudget, nearingLimit, lineOverruns }`.

## Intentionally unchanged

- **`project-attention` API** (documents/issues) — not extended with cost rows in this step; cost pressure is carried via **summary** + **deriveProjectStatus** instead.
- Portfolio **`/api/v1/portfolio/summary`** — still uses per-project `getBudgetSummary` from cost service; no schema change required for this step.
