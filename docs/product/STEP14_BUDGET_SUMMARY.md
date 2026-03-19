# Step 14 — Budget / Cost Module Summary

## What budget/cost capability is now real

- **Project budget** is the derived sum of non-archived cost items (planned_total, actual_total); no separate budget row.
- **Budget summary** includes **variance_amount** (actual_total − planned_total) and over_budget; exposed in API and UI.
- **Manager can create and edit** cost items (title, category, planned/actual, status, optional milestone) from the project Costs tab; Edit flow uses existing PATCH API.
- **Status card** clearly shows: "No budget configured" (no items), "No actuals yet" (items exist, actual_total === 0), or "Over budget" / "On budget"; variance is shown when non-zero.
- **Cost risk signals** (over-budget, budget pressure, item overrun) feed risk-intelligence; no new action queue.
- **State model** is documented (no budget / no actuals / on / over / under; per-item status); **domain model** and **governance** (lightweight) and **action integration** are documented.

## What remains partial and why

- **Tests:** Variance and summary behavior are covered in cost.repository.test.ts; Vitest was not run in this session due to esbuild platform mismatch in the environment. Running tests in CI or on the correct platform is recommended.
- **Governance:** Only manager-only write and milestone link; no cost-approval workflow or document–cost link (by design for this phase).

## Next major step allowed

**Yes.** Step 14 is closed. The product has a real budget/cost layer, explicit semantics, and manager-facing cost visibility. No blocking P0 items. Proceeding to the next major step (e.g. Step 15) is allowed.

## Exact blockers (if any)

None. The only caveat is test execution in a compatible environment (P1).
