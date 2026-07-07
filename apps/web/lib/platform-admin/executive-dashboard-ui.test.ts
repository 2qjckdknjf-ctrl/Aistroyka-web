import { describe, expect, it } from "vitest";
import {
  buildPlainEnglishReleaseWhy,
  buildPlatformHealthCards,
  buildPrioritizedActions,
  buildRecentChangesTimeline,
  groupBusinessImpact,
  qualityStatusToHealthBucket,
} from "./executive-dashboard-ui";
import type { RomaEngineeringIntelligence } from "./roma-engineering-intelligence.types";
import type { RomaQualityDashboard } from "./roma-quality-dashboard.types";

function minimalDashboard(): RomaQualityDashboard {
  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt: "2026-07-07T08:00:00.000Z",
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
      lastUpdated: "2026-07-07T08:00:00.000Z",
    },
    domainSections: [{ id: "release", label: "Release", status: "healthy", statusLabel: "Healthy", summary: "", highlights: [] }],
    systemComponents: [
      {
        id: "database",
        name: "Database",
        status: "healthy",
        statusLabel: "Healthy",
        lastCheck: "2026-07-07T08:00:00.000Z",
        details: "",
      },
      {
        id: "ai",
        name: "AI",
        status: "not_configured",
        statusLabel: "Not configured",
        lastCheck: "2026-07-07T08:00:00.000Z",
        details: "",
      },
    ],
    releaseReadiness: [],
    knownRisks: [],
    blockers: [],
    recommendations: [],
    latestChanges: { lastDeploy: null, lastCommit: null, branch: null, build: "abc1234", timestamp: null },
    platformTimeline: [],
    dataCoverage: {
      lastRefresh: "2026-07-07T08:41:00.000Z",
      coveragePercent: 96,
      connectedCount: 12,
      totalCatalogCount: 15,
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
    engineeringAssessment: "Healthy production posture.",
    releaseDecision: "ready_with_warnings",
    releaseDecisionLabel: "Ready with warnings",
    riskAnalysis: "Minor AI gap.",
    businessImpact: "Low.",
    actionPlan: ["Verify database migration state"],
    confidenceScore: "high",
    confidencePercent: 96,
    engineeringSummary: "OK",
    ownerSummary: {
      releaseDecisionLabel: "Ready with warnings",
      confidenceLabel: "High",
      readinessScoreLabel: "96%",
      criticalBlockersCount: 0,
      warningCount: 1,
      evidenceCoveragePercent: 96,
      lastUpdated: "2026-07-07T08:00:00.000Z",
      environment: "Production",
      nextSafeAction: "Verify database migration state",
    },
    decisionReasons: [
      {
        title: "AI provider not configured",
        component: "ai",
        severity: "warning",
        evidence: "OpenAI key missing",
        impact: "Copilot may not run live",
        recommendation: "Verify database migration state",
        recheckCondition: "After env update",
      },
    ],
    affectedProductAreas: [
      { id: "a", label: "AI Copilot", status: "affected", evidence: "Not configured" },
      { id: "b", label: "Mobile apps", status: "not_affected", evidence: null },
    ],
    coverageExplanation: "12 of 15 sources connected.",
    coverageBlindSpots: ["Performance telemetry unavailable"],
    topRisks: [],
    recommendations: [],
    reasoning: [],
  };
}

describe("Executive dashboard V3 UI helpers", () => {
  it("maps quality status to health buckets for sorting", () => {
    expect(qualityStatusToHealthBucket("unavailable")).toBe("critical");
    expect(qualityStatusToHealthBucket("healthy")).toBe("healthy");
  });

  it("builds prioritized actions capped at five", () => {
    const actions = buildPrioritizedActions(minimalIntelligence(), "/platform-admin/testing");
    expect(actions.length).toBeLessThanOrEqual(5);
    expect(actions[0]?.priority).toBe(1);
  });

  it("sorts platform health cards critical first", () => {
    const dashboard = minimalDashboard();
    dashboard.systemComponents.push({
      id: "storage",
      name: "Storage",
      status: "unavailable",
      statusLabel: "Unavailable",
      lastCheck: "",
      details: "",
    });
    const cards = buildPlatformHealthCards(dashboard);
    expect(cards[0]?.bucket).toBe("critical");
  });

  it("groups business impact for executive layout", () => {
    const groups = groupBusinessImpact(minimalIntelligence().affectedProductAreas);
    expect(groups.affected).toHaveLength(1);
    expect(groups.healthy).toHaveLength(1);
  });

  it("builds plain English release why lines", () => {
    const lines = buildPlainEnglishReleaseWhy(minimalIntelligence());
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).not.toMatch(/probe/i);
  });

  it("builds recent changes timeline without synthetic Yesterday labels", () => {
    const timeline = buildRecentChangesTimeline(minimalDashboard(), minimalIntelligence(), []);
    expect(timeline.every((entry) => entry.timeLabel !== "Yesterday")).toBe(true);
  });

  it("uses sentence-case release labels in timeline when audits exist", () => {
    const timeline = buildRecentChangesTimeline(minimalDashboard(), minimalIntelligence(), [
      {
        id: "run-1",
        createdAt: "2026-07-07T08:00:00.000Z",
        releaseRecommendation: "ready_with_warnings",
        status: "degraded",
        confidence: "high",
        environment: "Production",
        summary: "ok",
      },
    ]);
    const auditEntry = timeline.find((e) => e.id.startsWith("audit-"));
    expect(auditEntry?.title).toContain("Ready with warnings");
  });
});
