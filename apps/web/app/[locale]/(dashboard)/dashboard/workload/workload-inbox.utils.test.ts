import { describe, expect, it } from "vitest";
import {
  countWorkloadByPriority,
  filterWorkloadByPriority,
  parseWorkloadPriorityFilter,
  sortWorkloadByPriority,
} from "./workload-inbox.utils";

describe("workload-inbox.utils", () => {
  it("parses priority filter", () => {
    expect(parseWorkloadPriorityFilter(null)).toBe("all");
    expect(parseWorkloadPriorityFilter("urgent")).toBe("urgent");
    expect(parseWorkloadPriorityFilter("nope")).toBe("all");
  });

  it("filters and counts by priority", () => {
    const items = [
      { id: "a", priority: "normal" as const },
      { id: "b", priority: "urgent" as const },
      { id: "c", priority: "high" as const },
    ];
    expect(filterWorkloadByPriority(items, "high")).toEqual([{ id: "c", priority: "high" }]);
    expect(countWorkloadByPriority(items)).toEqual({ all: 3, urgent: 1, high: 1, normal: 1 });
  });

  it("sorts urgent before high before normal", () => {
    const sorted = sortWorkloadByPriority([
      { id: "n", priority: "normal" as const },
      { id: "u", priority: "urgent" as const },
      { id: "h", priority: "high" as const },
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["u", "h", "n"]);
  });
});
