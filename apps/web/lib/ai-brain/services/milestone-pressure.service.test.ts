import { describe, it, expect, vi } from "vitest";
import { getMilestonePressureSignals, milestonePressureToRiskSignals } from "./milestone-pressure.service";

vi.mock("@supabase/supabase-js", () => ({}));

describe("milestonePressureToRiskSignals", () => {
  it("converts overdue milestone to high severity risk", () => {
    const signals = [
      {
        milestoneId: "m1",
        projectId: "p1",
        title: "Foundation",
        targetDate: "2025-01-01",
        status: "pending",
        linkedTaskCount: 3,
        doneTaskCount: 1,
        overdue: true,
        atRisk: true,
        at: new Date().toISOString(),
      },
    ];
    const risks = milestonePressureToRiskSignals(signals);
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      source: "milestone_overdue",
      severity: "high",
      title: "Overdue milestone",
      resourceType: "project_milestone",
      resourceId: "m1",
    });
  });

  it("skips non-at-risk milestones", () => {
    const signals = [
      {
        milestoneId: "m1",
        projectId: "p1",
        title: "Foundation",
        targetDate: "2026-12-31",
        status: "done",
        linkedTaskCount: 3,
        doneTaskCount: 3,
        overdue: false,
        atRisk: false,
        at: new Date().toISOString(),
      },
    ];
    const risks = milestonePressureToRiskSignals(signals);
    expect(risks).toHaveLength(0);
  });
});
