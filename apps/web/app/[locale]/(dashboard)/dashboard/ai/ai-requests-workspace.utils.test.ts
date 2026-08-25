import { describe, expect, it } from "vitest";
import {
  aiSummaryChipOrder,
  buildAiRecommendationKeys,
  buildAiRiskHeatmapFromRequests,
  buildAiWavePointsFromRequests,
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

  it("builds heatmap from request rows", () => {
    const cells = buildAiRiskHeatmapFromRequests([
      { type: "analysis", status: "failed" },
      { type: "analysis", status: "success" },
    ]);
    expect(cells.length).toBe(25);
    expect(cells.some((c) => c.level > 0)).toBe(true);
  });

  it("builds wave points for recent days", () => {
    const today = new Date().toISOString().slice(0, 10);
    const points = buildAiWavePointsFromRequests([
      { created_at: `${today}T10:00:00Z`, status: "failed" },
      { created_at: `${today}T11:00:00Z`, status: "success" },
    ]);
    expect(points.length).toBe(14);
    const todayPoint = points.find((p) => p.key === today);
    expect(todayPoint?.total).toBe(2);
    expect(todayPoint?.risk).toBe(1);
  });

  it("builds recommendation keys from summary", () => {
    expect(
      buildAiRecommendationKeys({
        total: 10,
        queued: 1,
        running: 0,
        success: 7,
        failed: 2,
        dead: 0,
      }),
    ).toEqual(["aiRecFailedCount", "aiRecQueueCount"]);
  });
});
