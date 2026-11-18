import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  buildLookaheadDayStrip,
  isMilestoneOverdue,
  parseScheduleLookaheadDays,
  partitionScheduleMilestones,
  summarizeScheduleHealth,
} from "./schedule-health";

describe("schedule-health", () => {
  it("flags open milestones before today as overdue", () => {
    expect(isMilestoneOverdue("planned", "2026-08-01", "2026-08-19")).toBe(true);
    expect(isMilestoneOverdue("done", "2026-08-01", "2026-08-19")).toBe(false);
    expect(isMilestoneOverdue("cancelled", "2026-08-01", "2026-08-19")).toBe(false);
    expect(isMilestoneOverdue("planned", "2026-08-20", "2026-08-19")).toBe(false);
  });

  it("summarizes overdue, upcoming, and done counts", () => {
    expect(
      summarizeScheduleHealth(
        [
          { status: "done", target_date: "2026-07-01" },
          { status: "planned", target_date: "2026-08-01" },
          { status: "planned", target_date: "2026-09-01" },
          { status: "cancelled", target_date: "2026-08-01" },
        ],
        "2026-08-19",
      ),
    ).toEqual({ overdue: 1, upcoming: 1, done: 1 });
  });

  it("parses lookahead window and adds days in UTC", () => {
    expect(parseScheduleLookaheadDays(null)).toBe(7);
    expect(parseScheduleLookaheadDays("14")).toBe(14);
    expect(parseScheduleLookaheadDays("30")).toBe(30);
    expect(addDaysIso("2026-08-19", 7)).toBe("2026-08-26");
  });

  it("partitions overdue, lookahead, later, and done", () => {
    const parts = partitionScheduleMilestones(
      [
        { id: "o", status: "planned", target_date: "2026-08-01", title: "Overdue" },
        { id: "l", status: "planned", target_date: "2026-08-22", title: "Lookahead" },
        { id: "x", status: "planned", target_date: "2026-10-01", title: "Later" },
        { id: "d", status: "done", target_date: "2026-07-01", title: "Done" },
        { id: "c", status: "cancelled", target_date: "2026-08-20", title: "Cancel" },
      ],
      "2026-08-19",
      7,
    );
    expect(parts.overdue.map((m) => m.id)).toEqual(["o"]);
    expect(parts.lookahead.map((m) => m.id)).toEqual(["l"]);
    expect(parts.later.map((m) => m.id)).toEqual(["x"]);
    expect(parts.done.map((m) => m.id)).toEqual(["d"]);
  });

  it("builds a 7-day open-milestone density strip", () => {
    expect(
      buildLookaheadDayStrip(
        [
          { status: "planned", target_date: "2026-08-19" },
          { status: "planned", target_date: "2026-08-19" },
          { status: "done", target_date: "2026-08-20" },
          { status: "planned", target_date: "2026-08-21" },
        ],
        "2026-08-19",
        3,
      ),
    ).toEqual([
      { date: "2026-08-19", count: 2 },
      { date: "2026-08-20", count: 0 },
      { date: "2026-08-21", count: 1 },
    ]);
  });
});
