import { describe, it, expect } from "vitest";
import { buildMilestoneScheduleSignals, milestoneTaskProgressPercent } from "./milestone.schedule";

describe("buildMilestoneScheduleSignals", () => {
  it("returns empty for completed milestone", () => {
    expect(
      buildMilestoneScheduleSignals(
        { target_date: "2020-01-01", status: "completed" },
        { total: 2, done: 2 },
        "2026-03-28"
      )
    ).toEqual([]);
  });

  it("flags overdue when target before today and active", () => {
    const s = buildMilestoneScheduleSignals(
      { target_date: "2026-01-01", status: "planned" },
      { total: 0, done: 0 },
      "2026-03-28"
    );
    expect(s.some((x) => x.code === "milestone_overdue")).toBe(true);
  });

  it("prefers incomplete-tasks message when overdue and tasks remain", () => {
    const s = buildMilestoneScheduleSignals(
      { target_date: "2026-01-01", status: "in_progress" },
      { total: 3, done: 1 },
      "2026-03-28"
    );
    expect(s.some((x) => x.code === "milestone_incomplete_tasks_past_target")).toBe(true);
    expect(s.some((x) => x.code === "milestone_overdue")).toBe(false);
  });

  it("flags due soon in window", () => {
    const s = buildMilestoneScheduleSignals(
      { target_date: "2026-04-01", status: "planned" },
      { total: 1, done: 0 },
      "2026-03-28"
    );
    expect(s.some((x) => x.code === "milestone_due_soon")).toBe(true);
  });
});

describe("milestoneTaskProgressPercent", () => {
  it("returns 0 when no tasks", () => {
    expect(milestoneTaskProgressPercent({ total: 0, done: 0 })).toBe(0);
  });
  it("returns rounded percent", () => {
    expect(milestoneTaskProgressPercent({ total: 3, done: 1 })).toBe(33);
  });
});
