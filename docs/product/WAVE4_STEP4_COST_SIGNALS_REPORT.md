# Wave 4 Step 4 — Cost signals (Stage C)

## Implemented signals

| Signal id | Condition | Severity |
|-----------|-----------|----------|
| `project_over_budget` | Sum of actual > sum of planned (non-archived lines) | critical |
| `project_nearing_budget` | Not over, but actual ≥ 90% of planned total | warning |
| `line_items_overrun` | One or more lines where actual > planned on that line | warning / critical* |
| `milestone_linked_overrun` | At least one overrun line has `milestone_id` set | warning |

\*Severity follows project over-budget state for line overrun signal (see `cost-signals.ts`).

## Explainability

Each signal includes a **plain-language `reason`** string (numeric amounts and currency in text). No ML, no forecasts, no implied precision beyond stored numbers.

## Limitations

- **90% threshold** is a fixed product rule, not statistically tuned.
- **Single currency per line** stored as text; cross-currency rollups are not normalized (out of scope).
- No cash-flow or accrual semantics — **visibility only**, not accounting.
