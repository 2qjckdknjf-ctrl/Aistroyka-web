import { describe, expect, it } from "vitest";
import { aggregateContractorMetrics, buildMetricsMap } from "./contractor-directory.metrics";

describe("contractor-directory.metrics", () => {
  it("aggregates tasks, reports, and projects", () => {
    const tasks = [
      {
        assigned_to: "u1",
        status: "done",
        due_date: "2026-01-01",
        updated_at: "2026-01-03T12:00:00Z",
      },
      { assigned_to: "u1", status: "pending", due_date: null, updated_at: "2026-01-01T00:00:00Z" },
    ];
    const reports = [
      { user_id: "u1", status: "approved" },
      { user_id: "u1", status: "rejected" },
      { user_id: "u1", status: "changes_requested" },
      { user_id: "u1", status: "draft" },
    ];
    const m = aggregateContractorMetrics("u1", tasks, reports, new Set(["p1", "p2"]));
    expect(m.tasks_completed).toBe(1);
    expect(m.tasks_in_progress).toBe(1);
    expect(m.reports_submitted).toBe(3);
    expect(m.active_projects).toBe(2);
    expect(m.rejection_rate).toBe(0.5);
    expect(m.quality_score).toBeGreaterThanOrEqual(0);
    expect(m.quality_score).toBeLessThanOrEqual(100);
  });

  it("buildMetricsMap returns per-user entries", () => {
    const map = buildMetricsMap({
      userIds: ["a", "b"],
      tasks: [],
      reports: [],
      memberships: [
        { user_id: "a", project_id: "p1" },
        { user_id: "b", project_id: "p2" },
      ],
    });
    expect(map.size).toBe(2);
    expect(map.get("a")?.active_projects).toBe(1);
  });
});
