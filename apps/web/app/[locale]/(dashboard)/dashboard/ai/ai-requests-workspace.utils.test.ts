import { describe, expect, it } from "vitest";
import {
  aiSummaryChipOrder,
  parseAiStatusFilter,
  sortAiRequestsByAttention,
} from "./ai-requests-workspace.utils";

describe("ai-requests-workspace.utils", () => {
  it("parses status filter", () => {
    expect(parseAiStatusFilter(null)).toBe("all");
    expect(parseAiStatusFilter("failed")).toBe("failed");
    expect(parseAiStatusFilter("nope")).toBe("all");
  });

  it("orders summary chips with attention statuses always when total > 0", () => {
    const chips = aiSummaryChipOrder({
      total: 10,
      queued: 0,
      running: 0,
      success: 8,
      failed: 2,
      dead: 0,
    });
    expect(chips.map((c) => c.status)).toEqual(["failed", "dead", "running", "success"]);
  });

  it("sorts failed before success", () => {
    const sorted = sortAiRequestsByAttention([
      { id: "s", status: "success", updated_at: "2026-08-21T10:00:00Z" },
      { id: "f", status: "failed", updated_at: "2026-08-20T10:00:00Z" },
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["f", "s"]);
  });
});
