import { describe, expect, it } from "vitest";
import { computeHealthFromCounts, scoreToBand } from "./project-health";

describe("project health v1", () => {
  it("maps score bands", () => {
    expect(scoreToBand(80)).toBe("GREEN");
    expect(scoreToBand(60)).toBe("AMBER");
    expect(scoreToBand(59)).toBe("RED");
  });

  it("starts at 100 with no pressure", () => {
    const h = computeHealthFromCounts({
      overdueTaskCount: 0,
      taskCount: 10,
      completedTaskCount: 4,
      workerCount: 2,
      openReportCount: 3,
    });
    expect(h.score).toBe(100);
    expect(h.band).toBe("GREEN");
  });

  it("applies overdue cap and combo penalty", () => {
    const h = computeHealthFromCounts({
      overdueTaskCount: 10,
      taskCount: 10,
      completedTaskCount: 0,
      workerCount: 1,
      openReportCount: 0,
    });
    expect(h.score).toBe(40);
    expect(h.band).toBe("RED");
    expect(h.reasons.length).toBeGreaterThan(0);
  });
});
