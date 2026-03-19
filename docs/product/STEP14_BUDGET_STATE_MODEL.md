# Step 14 — Budget State / Data Clarity Model

## 1. Goal

Managers must not confuse "missing data" with "healthy budget." States are explicit and UI/labels reflect them.

## 2. Project-level budget states

| State | Condition | Meaning | UI / label |
|-------|-----------|--------|------------|
| No budget configured | item_count === 0 | No cost items; no planned or actual data. | "No budget configured" (Status card); empty state "No cost items yet." |
| Budget configured, no actuals yet | item_count > 0, actual_total === 0, planned_total > 0 | Planned budget exists; no spending recorded. | "No actuals yet" (Status card). |
| On budget | item_count > 0, actual_total <= planned_total, actual_total > 0 | Spending recorded and within plan. | "On budget"; optional variance (negative or zero). |
| Over budget | actual_total > planned_total | Spending exceeds plan. | "Over budget"; variance shown (positive). |
| Under budget | item_count > 0, actual_total < planned_total, actual_total > 0 | Spending below plan. | "On budget"; variance (negative). |

## 3. Per-item states (status)

- **planned** — Line approved/planned; not yet committed or spent.
- **committed** — Committed (e.g. order placed); actual may still be 0.
- **incurred** — Cost incurred; actual_amount typically set.
- **approved** — Approved for closure/accounting.
- **archived** — Excluded from budget summary; historical record.

## 4. Data quality / evidence

- **Planned only:** planned_amount set, actual_amount 0. Treated as "no actuals" at project level when all items are so.
- **Actual recorded:** actual_amount > 0. Contributes to actual_total and variance.
- **Weak evidence:** We do not introduce a "confidence" or "estimate" flag; planned vs actual is the only distinction. If in the future we add "estimated" as a separate field, it would be documented and not confused with actual.

## 5. Variance

- **variance_amount** = actual_total − planned_total. Positive = over; negative = under. Shown in summary when non-zero so "missing data" is not implied when variance is zero (could be no actuals or exactly on plan).
