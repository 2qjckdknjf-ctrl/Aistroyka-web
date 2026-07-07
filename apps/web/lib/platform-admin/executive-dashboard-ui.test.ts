import { describe, expect, it } from "vitest";
import { buildExecutiveSummaryNarrative, groupDecisionReasonsBySeverity } from "./executive-dashboard-ui";
import type { RomaEngineeringIntelligence } from "./roma-engineering-intelligence.types";
import type { RomaQualityDashboard } from "./roma-quality-dashboard.types";

function minimalDashboard(): RomaQualityDashboard {
  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt: "2026-07-05T10:00:00.000Z",
    environment: {
      label: "Production",
      appUrl: "https://aistroyka.ai",
      nodeEnv: "production",
      preferredAdminHost: "admin.aistroyka.ai",
      adminHostDeployed: true,
    },
    platformStatus: {
      overallHealth: "healthy",
      overallHealthLabel: "Healthy",
      releaseReadiness: "ready",
      releaseReadinessPercent: 96,
      lastUpdated: "2026-07-05T10:00:00.000Z",
    },
    domainSections: [],
    systemComponents: [
      {
        id: "ai",
        name: "AI",
        status: "not_configured",
        statusLabel: "Not configured",
        lastCheck: "2026-07-05T10:00:00.000Z",
        details: "OpenAI not configured",
      },
    ],
    releaseReadiness: [],
    knownRisks: [],
    blockers: [],
    recommendations: [],
    latestChanges: { lastDeploy: null, lastCommit: null, branch: null, build: "abc1234", timestamp: null },
    platformTimeline: [],
    dataCoverage: {
      lastRefresh: "2026-07-05T10:00:00.000Z",
      coveragePercent: 96,
      connectedCount: 4,
      totalCatalogCount: 5,
      available: [],
      unavailable: [],
    },
    romaStatus: [],
    knownReports: [],
    dataSources: { available: [], unavailable: [] },
  };
}

function minimalIntelligence(): RomaEngineeringIntelligence {
  return {
    engineeringAssessment: "Platform probes indicate healthy production posture with minor gaps.",
    releaseDecision: "ready_with_warnings",
    releaseDecisionLabel: "READY WITH WARNINGS",
    riskAnalysis: "One warning affects AI configuration.",
    businessImpact: "Limited impact on AI-assisted workflows.",
    actionPlan: ["Verify OpenAI configuration when enabling AI features."],
    confidenceScore: "high",
    confidencePercent: 96,
    engineeringSummary: "Healthy with warnings.",
    ownerSummary: {
      releaseDecisionLabel: "READY WITH WARNINGS",
      confidenceLabel: "HIGH",
      readinessScoreLabel: "96%",
      criticalBlockersCount: 0,
      warningCount: 1,
      evidenceCoveragePercent: 96,
      lastUpdated: "2026-07-05T10:00:00.000Z",
      environment: "Production",
      nextSafeAction: "Review AI provider configuration.",
    },
    decisionReasons: [],
    affectedProductAreas: [],
    coverageExplanation: "Most live sources connected.",
    coverageBlindSpots: [],
    topRisks: [],
    recommendations: [],
    reasoning: [],
  };
}

describe("Executive dashboard UI helpers", () => {
  it("builds narrative from engineering intelligence without new rules", () => {
    const dashboard = minimalDashboard();
    const intelligence = minimalIntelligence();
    const lines = buildExecutiveSummaryNarrative(dashboard, intelligence);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.some((l) => /release is ready with warnings/i.test(l))).toBe(true);
    expect(lines.some((l) => /ai provider is not configured/i.test(l))).toBe(true);
  });

  it("groups decision reasons by severity", () => {
    const grouped = groupDecisionReasonsBySeverity([
      {
        title: "Critical",
        component: "db",
        severity: "critical",
        evidence: "e",
        impact: "i",
        recommendation: "r",
        recheckCondition: "c",
      },
      {
        title: "Warn",
        component: "ai",
        severity: "warning",
        evidence: "e",
        impact: "i",
        recommendation: "r",
        recheckCondition: "c",
      },
    ]);
    expect(grouped.critical).toHaveLength(1);
    expect(grouped.warning).toHaveLength(1);
  });
});
