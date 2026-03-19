import { describe, it, expect } from "vitest";
import { getOperatingCenterPanelState } from "./operating-center-panel-state";
import type { ProjectIntelligenceData } from "@/components/intelligence/types";

describe("getOperatingCenterPanelState", () => {
  it("returns empty state when data is null", () => {
    const state = getOperatingCenterPanelState(null);
    expect(state.hasHealth).toBe(false);
    expect(state.hasRisks).toBe(false);
    expect(state.hasSummary).toBe(false);
    expect(state.hasEvidenceGaps).toBe(false);
    expect(state.riskCount).toBe(0);
    expect(state.evidenceGapCount).toBe(0);
    expect(state.healthLabel).toBeNull();
  });

  it("returns empty state when data is undefined", () => {
    const state = getOperatingCenterPanelState(undefined);
    expect(state.hasHealth).toBe(false);
    expect(state.riskCount).toBe(0);
  });

  it("detects health from projectHealthScore", () => {
    const data: ProjectIntelligenceData = {
      insights: [],
      riskOverview: { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: { signals: [] },
      reportingDiscipline: { signals: [] },
      recommendations: [],
      projectHealthScore: {
        projectId: "p1",
        tenantId: "t1",
        at: new Date().toISOString(),
        score: 75,
        label: "moderate",
        factorContributions: [],
        blockers: [],
        missingData: [],
        delayIndicators: [],
        confidence: "medium",
      },
    };
    const state = getOperatingCenterPanelState(data);
    expect(state.hasHealth).toBe(true);
    expect(state.healthLabel).toBe("moderate");
  });

  it("detects risks from riskOverview and topRiskInsights", () => {
    const data: ProjectIntelligenceData = {
      insights: [],
      riskOverview: { high: 1, medium: 2, low: 0, signals: [{ projectId: "p1", source: "ai", severity: "high", title: "R1", at: "" }] },
      evidenceCoverage: { signals: [] },
      reportingDiscipline: { signals: [] },
      recommendations: [],
      topRiskInsights: [
        {
          id: "r1",
          projectId: "p1",
          rank: 1,
          severity: "high",
          title: "Risk",
          description: "d",
          source: "ai",
          explanation: "e",
          evidenceReferences: [],
          confidence: "high",
          contributingFactors: [],
          recommendedAction: "act",
          at: "",
        },
      ],
    };
    const state = getOperatingCenterPanelState(data);
    expect(state.hasRisks).toBe(true);
    expect(state.riskCount).toBeGreaterThan(0);
  });

  it("detects evidence gaps from evidenceCoverage.signals", () => {
    const data: ProjectIntelligenceData = {
      insights: [],
      riskOverview: { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: {
        signals: [
          { projectId: "p1", type: "photo", severity: "medium", message: "Missing photo", at: "" },
        ],
      },
      reportingDiscipline: { signals: [] },
      recommendations: [],
    };
    const state = getOperatingCenterPanelState(data);
    expect(state.hasEvidenceGaps).toBe(true);
    expect(state.evidenceGapCount).toBe(1);
  });

  it("detects summary from executiveProjectSummary", () => {
    const data: ProjectIntelligenceData = {
      insights: [],
      riskOverview: { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: { signals: [] },
      reportingDiscipline: { signals: [] },
      recommendations: [],
      executiveProjectSummary: {
        projectId: "p1",
        tenantId: "t1",
        at: "",
        headline: "OK",
        summary: "Summary",
        healthLabel: "healthy",
        healthScore: 80,
        recentProgress: [],
        atRisk: [],
        missingEvidence: [],
        requiresAttention: [],
        topRisks: [],
        recommendedActions: [],
        metrics: [],
        dataSufficiency: "sufficient",
      },
    };
    const state = getOperatingCenterPanelState(data);
    expect(state.hasSummary).toBe(true);
  });

  it("sets hasMissingDataDisclaimer when health has missingDataDisclaimer", () => {
    const data: ProjectIntelligenceData = {
      insights: [],
      riskOverview: { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: { signals: [] },
      reportingDiscipline: { signals: [] },
      recommendations: [],
      projectHealthScore: {
        projectId: "p1",
        tenantId: "t1",
        at: "",
        score: 50,
        label: "moderate",
        factorContributions: [],
        blockers: [],
        missingData: [],
        delayIndicators: [],
        confidence: "low",
        missingDataDisclaimer: "Limited data",
      },
    };
    const state = getOperatingCenterPanelState(data);
    expect(state.hasMissingDataDisclaimer).toBe(true);
  });
});
