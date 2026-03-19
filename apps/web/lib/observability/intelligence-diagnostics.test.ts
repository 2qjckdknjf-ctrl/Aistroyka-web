import { describe, expect, it } from "vitest";
import { buildIntelligenceDiagnosticsPayload } from "./intelligence-diagnostics";
import type { ExecutiveProjectSummary, ProjectHealthScore } from "@/lib/ai-brain/domain/intelligence-output.types";

describe("buildIntelligenceDiagnosticsPayload", () => {
  it("never includes raw narrative fields", () => {
    const exec: ExecutiveProjectSummary = {
      projectId: "p1",
      tenantId: "t1",
      at: new Date().toISOString(),
      headline: "SECRET HEADLINE",
      summary: "SECRET LONG TEXT",
      healthLabel: "critical",
      healthScore: 22,
      recentProgress: [],
      atRisk: [],
      missingEvidence: [],
      requiresAttention: [],
      topRisks: [],
      recommendedActions: [],
      metrics: [],
      dataSufficiency: "insufficient",
      missingDataDisclaimer: "No data",
    };
    const health: ProjectHealthScore = {
      projectId: "p1",
      tenantId: "t1",
      at: new Date().toISOString(),
      score: 30,
      label: "unstable",
      factorContributions: [{ factor: "reporting", impact: -10, explanation: "SECRET" }],
      blockers: [],
      missingData: [],
      delayIndicators: [],
      confidence: "low",
    };
    const payload = buildIntelligenceDiagnosticsPayload({
      executiveProjectSummary: exec,
      projectHealthScore: health,
      riskOverview: { high: 2, medium: 1, low: 0 },
      missingEvidenceInsightsCount: 3,
      topRiskInsightsCount: 2,
      managerInsightsCount: 1,
    });
    const json = JSON.stringify(payload);
    expect(json).not.toContain("SECRET");
    expect(payload.health_factor_keys).toEqual(["reporting"]);
    expect(payload.degradation_reason_codes).toContain("executive_data_insufficient");
    expect(payload.degradation_reason_codes).toContain("health_confidence_low");
    expect(payload.missing_data_disclaimer).toBe(true);
  });
});
