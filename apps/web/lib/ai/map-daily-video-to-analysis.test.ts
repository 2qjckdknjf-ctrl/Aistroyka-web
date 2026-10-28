import { describe, expect, it } from "vitest";
import { mapDailyVideoToAnalysisResult } from "./map-daily-video-to-analysis";

describe("mapDailyVideoToAnalysisResult", () => {
  it("maps daily video fields into durable analysis shape", () => {
    const out = mapDailyVideoToAnalysisResult({
      work_date: "2026-10-28",
      summary: "Slab pour in progress",
      activities_observed: ["concrete pour"],
      materials_or_equipment_visible: ["pump"],
      completion_estimate_percent: 55.6,
      risk_level: "medium",
      issues_and_risks: ["wet weather"],
      recommendations: ["cover slab"],
      visibility_notes: "low light",
    });
    expect(out.stage).toBe("Slab pour in progress");
    expect(out.completion_percent).toBe(56);
    expect(out.risk_level).toBe("medium");
    expect(out.detected_issues).toEqual(
      expect.arrayContaining(["wet weather", "activity: concrete pour", "material: pump", "visibility: low light"])
    );
    expect(out.recommendations).toEqual(["cover slab"]);
  });
});
