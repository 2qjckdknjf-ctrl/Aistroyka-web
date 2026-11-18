import { describe, expect, it } from "vitest";
import {
  buildGanttBars,
  buildGanttMonthHeaders,
  computeGanttRange,
  computeScheduleCompletionPercent,
  projectedScheduleEnd,
  todayMarkerPercent,
} from "./gantt-layout.utils";

describe("gantt-layout.utils", () => {
  const today = "2026-08-25";

  it("computes range and bars for milestones", () => {
    const milestones = [
      { id: "1", title: "A", target_date: "2026-09-01", status: "planned" },
      { id: "2", title: "B", target_date: "2026-09-15", status: "in_progress" },
    ];
    const range = computeGanttRange(milestones, today);
    expect(range.totalDays).toBeGreaterThan(0);
    const bars = buildGanttBars(milestones, range, today);
    expect(bars).toHaveLength(2);
    expect(bars[0].widthPercent).toBeGreaterThan(0);
    expect(todayMarkerPercent(range, today)).not.toBeNull();
  });

  it("summarizes completion and projected end", () => {
    const milestones = [
      { title: "Done", target_date: "2026-08-01", status: "done" },
      { title: "Open", target_date: "2026-09-30", status: "planned" },
    ];
    expect(computeScheduleCompletionPercent(milestones)).toBe(50);
    expect(projectedScheduleEnd(milestones, today)).toBe("2026-09-30");
  });

  it("builds month headers", () => {
    const range = computeGanttRange(
      [{ id: "m1", title: "M", target_date: "2026-10-20", status: "planned" }],
      today,
    );
    const headers = buildGanttMonthHeaders(range);
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0].label.length).toBeGreaterThan(0);
  });
});
