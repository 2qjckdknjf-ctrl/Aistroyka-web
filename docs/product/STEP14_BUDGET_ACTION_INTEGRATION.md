# Step 14 — Budget Action / Intelligence Integration

## 1. What is integrated

- **Cost risk signals (getCostRiskSignals):** Used by risk-intelligence.service. For a project, returns:
  - **budget_overrun (high):** When summary.over_budget (actual_total > planned_total). Title: "Project over budget"; description includes actual vs planned.
  - **cost_pressure (medium):** When not over budget but actual/planned >= 0.9 (90% spent). Title: "Budget pressure"; description includes % of planned.
  - **cost_pressure (medium), per item:** When a single cost item has actual > planned. Title: "Cost item overrun"; description includes item title and amounts.
- **Risk intelligence:** risk-intelligence.service aggregates cost signals with other project risks and exposes them in the intelligence/risk surface. No separate "budget action queue"; budget appears as risk/attention signals where applicable.

## 2. Signals are real

- All signals are derived from project_cost_items and getBudgetSummary. No invented KPIs. over_budget and item overrun are exact; "budget pressure" at 90% is a simple threshold.

## 3. What we do not add in Step 14

- No market pricing or ROI analytics.
- No "missing budget setup" automatic signal (e.g. "Project has no cost items") — could be added later as a lightweight hint; not required for closure.
- No separate budget "action items" list; cost is integrated via existing risk/intelligence path.

## 4. Explainability

- Each signal describes the condition (e.g. "Actual X exceeds planned Y"); severity (high for over budget, medium for pressure/item overrun) is explicit. Manager can open project Costs tab to see items and summary.
