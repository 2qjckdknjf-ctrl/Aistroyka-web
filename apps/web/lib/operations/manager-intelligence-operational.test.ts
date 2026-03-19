import { describe, expect, it } from "vitest";
import { buildManagerOperationalContext } from "./manager-intelligence-operational";

describe("buildManagerOperationalContext", () => {
  it("marks insufficient data and low trust", () => {
    const ctx = buildManagerOperationalContext({
      requestId: "req-1",
      executiveProjectSummary: {
        dataSufficiency: "insufficient",
        missingDataDisclaimer: "Minimal data.",
        recommendedActions: ["Add tasks"],
      },
      projectHealthScore: { confidence: "low", factorContributions: [{ factor: "reporting", impact: -5 }] },
      riskOverview: { high: 0, medium: 0, low: 0 },
      recommendations: [],
      missingEvidenceInsights: [],
      topRiskInsights: [],
    });
    expect(ctx.state).toBe("insufficient_data");
    expect(ctx.trust_band).toBe("low");
    expect(ctx.request_id).toBe("req-1");
    expect(ctx.next_step_hints).toContain("Add tasks");
  });

  it("surfaces high risks in why_bullets", () => {
    const ctx = buildManagerOperationalContext({
      requestId: "r2",
      executiveProjectSummary: { dataSufficiency: "sufficient" },
      projectHealthScore: { confidence: "high", factorContributions: [] },
      riskOverview: { high: 2, medium: 1, low: 0 },
      recommendations: [{ title: "Review safety briefing" }],
      missingEvidenceInsights: [],
      topRiskInsights: [],
    });
    expect(ctx.why_bullets.some((b) => b.includes("high-severity"))).toBe(true);
    expect(ctx.next_step_hints).toContain("Review safety briefing");
  });
});
