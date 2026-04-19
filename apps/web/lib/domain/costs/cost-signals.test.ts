import { describe, it, expect } from "vitest";
import { buildCostPressureSignals } from "./cost-signals";
import type { ProjectBudgetSummary } from "./cost.types";

function base(overrides: Partial<ProjectBudgetSummary>): ProjectBudgetSummary {
  return {
    project_id: "p1",
    tenant_id: "t1",
    planned_total: 10000,
    actual_total: 8000,
    variance_amount: -2000,
    currency: "RUB",
    over_budget: false,
    item_count: 2,
    utilization_ratio: 0.8,
    nearing_budget_limit: false,
    item_overrun_count: 0,
    milestone_linked_overrun_count: 0,
    signals: [],
    ...overrides,
  };
}

describe("buildCostPressureSignals", () => {
  it("returns empty when no cost items", () => {
    const s = base({ item_count: 0, planned_total: 0, actual_total: 0, utilization_ratio: 0 });
    expect(buildCostPressureSignals(s)).toEqual([]);
  });

  it("emits project_over_budget when over_budget", () => {
    const s = base({
      over_budget: true,
      actual_total: 11000,
      planned_total: 10000,
      variance_amount: 1000,
      utilization_ratio: 1.1,
    });
    const sigs = buildCostPressureSignals(s);
    expect(sigs.find((x) => x.id === "project_over_budget")?.severity).toBe("critical");
  });

  it("emits nearing when flag set and not over", () => {
    const s = base({
      nearing_budget_limit: true,
      actual_total: 9200,
      planned_total: 10000,
      utilization_ratio: 0.92,
    });
    const sigs = buildCostPressureSignals(s);
    expect(sigs.some((x) => x.id === "project_nearing_budget")).toBe(true);
  });

  it("emits line_items_overrun when item_overrun_count > 0", () => {
    const s = base({ item_overrun_count: 2 });
    const sigs = buildCostPressureSignals(s);
    expect(sigs.some((x) => x.id === "line_items_overrun")).toBe(true);
  });
});
