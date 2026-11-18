import { describe, expect, it } from "vitest";
import {
  filterOpsQueuesForPhoneDensity,
  limitManagerActionsForPhoneDensity,
  opsKpiAttentionTier,
  partitionOpsKpisForPhoneDensity,
  sortOpsQueuesByPhoneDensity,
} from "./ops-overview-density.utils";

describe("ops-overview-density.utils", () => {
  it("tiers overdue/stuck KPIs as phone primary", () => {
    expect(opsKpiAttentionTier("kpiTasksOverdue")).toBe("primary");
    expect(opsKpiAttentionTier("kpiActiveProjects")).toBe("secondary");
    const { primary, secondary } = partitionOpsKpisForPhoneDensity([
      { labelKey: "kpiActiveProjects" },
      { labelKey: "kpiTasksOverdue" },
      { labelKey: "kpiStuckUploads" },
    ]);
    expect(primary.map((c) => c.labelKey)).toEqual(["kpiTasksOverdue", "kpiStuckUploads"]);
    expect(secondary.map((c) => c.labelKey)).toEqual(["kpiActiveProjects"]);
  });

  it("sorts non-empty urgent queues first and hides empties on phone", () => {
    const sorted = sortOpsQueuesByPhoneDensity([
      { id: "pushFailed" as const, count: 2 },
      { id: "tasksOverdue" as const, count: 0 },
      { id: "reportsPendingReview" as const, count: 1 },
    ]);
    expect(sorted.map((q) => q.id)).toEqual([
      "reportsPendingReview",
      "pushFailed",
      "tasksOverdue",
    ]);
    expect(
      filterOpsQueuesForPhoneDensity(sorted, { phone: true }).map((q) => q.id),
    ).toEqual(["reportsPendingReview", "pushFailed"]);
    expect(filterOpsQueuesForPhoneDensity(sorted, { phone: false })).toHaveLength(3);
  });

  it("limits manager actions on phone density", () => {
    const items = [1, 2, 3, 4, 5];
    expect(limitManagerActionsForPhoneDensity(items, { phone: false })).toEqual({
      visible: items,
      hiddenCount: 0,
    });
    expect(limitManagerActionsForPhoneDensity(items, { phone: true, limit: 3 })).toEqual({
      visible: [1, 2, 3],
      hiddenCount: 2,
    });
  });
});
