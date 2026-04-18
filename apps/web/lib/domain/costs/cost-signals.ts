/**
 * Explainable budget / cost pressure signals (Wave 4 Step 4).
 * Deterministic rules only — no forecasts or predictive finance.
 */

import type { CostPressureSignal, ProjectBudgetSummary } from "./cost.types";

/** 90% of planned total — "nearing limit" band (under total over-budget). */
const NEARING_RATIO = 0.9;

/**
 * Builds plain-language signals from an aggregate budget summary.
 * Safe to call with empty projects (item_count === 0).
 */
export function buildCostPressureSignals(summary: ProjectBudgetSummary): CostPressureSignal[] {
  const signals: CostPressureSignal[] = [];
  if (summary.item_count === 0) return signals;

  const cur = summary.currency || "RUB";
  const planned = summary.planned_total;
  const actual = summary.actual_total;

  if (summary.over_budget) {
    signals.push({
      id: "project_over_budget",
      severity: "critical",
      reason: `Total actual (${actual.toLocaleString()} ${cur}) exceeds total planned (${planned.toLocaleString()} ${cur}).`,
    });
  } else if (summary.nearing_budget_limit && planned > 0) {
    const pct = Math.round((actual / planned) * 100);
    signals.push({
      id: "project_nearing_budget",
      severity: "warning",
      reason: `Spending has reached about ${pct}% of planned total (${actual.toLocaleString()} of ${planned.toLocaleString()} ${cur}).`,
    });
  }

  if (summary.item_overrun_count > 0) {
    signals.push({
      id: "line_items_overrun",
      severity: summary.over_budget ? "critical" : "warning",
      reason: `${summary.item_overrun_count} cost line(s) have actual above planned on that line.`,
    });
  }

  if (summary.milestone_linked_overrun_count > 0) {
    signals.push({
      id: "milestone_linked_overrun",
      severity: "warning",
      reason: `${summary.milestone_linked_overrun_count} overrun line(s) are linked to a milestone.`,
    });
  }

  return signals;
}

/** @internal for tests — threshold used for nearing_budget_limit in repository. */
export const COST_SIGNAL_NEARING_RATIO = NEARING_RATIO;
