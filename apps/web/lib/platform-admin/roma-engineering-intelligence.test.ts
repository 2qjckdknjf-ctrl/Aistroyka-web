import { describe, expect, it } from "vitest";
import { buildRomaEngineeringIntelligence } from "./roma-engineering-intelligence";
import type { RomaQualityDashboard } from "./roma-quality-dashboard.types";

function baseDashboard(overrides?: Partial<RomaQualityDashboard>): RomaQualityDashboard {
  const generatedAt = "2026-07-03T12:00:00.000Z";
  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt,
    environment: {
      label: "Staging",
      appUrl: "https://staging.aistroyka.ai",
      nodeEnv: "production",
      preferredAdminHost: "admin.aistroyka.ai",
      adminHostDeployed: false,
    },
    platformStatus: {
      overallHealth: "healthy",
      overallHealthLabel: "Healthy",
      releaseReadiness: "ready",
      releaseReadinessPercent: 85,
      lastUpdated: generatedAt,
    },
    domainSections: [],
    systemComponents: [
      {
        id: "storage",
        name: "Storage",
        status: "healthy",
        statusLabel: "Healthy",
        lastCheck: generatedAt,
        details: "ok",
      },
      {
        id: "ai",
        name: "AI",
        status: "healthy",
        statusLabel: "Healthy",
        lastCheck: generatedAt,
        details: "openai configured",
      },
      {
        id: "database",
        name: "Database",
        status: "healthy",
        statusLabel: "Healthy",
        lastCheck: generatedAt,
        details: "ok",
      },
      {
        id: "backend_api",
        name: "Backend API",
        status: "healthy",
        statusLabel: "Healthy",
        lastCheck: generatedAt,
        details: "ok",
      },
    ],
    releaseReadiness: [],
    knownRisks: [],
    blockers: [],
    recommendations: [],
    latestChanges: {
      lastDeploy: generatedAt,
      lastCommit: "abc1234",
      branch: "main",
      build: "abc1234",
      timestamp: generatedAt,
    },
    platformTimeline: [
      {
        id: "last_migration",
        label: "Last migration",
        timestamp: generatedAt,
        displayValue: "20260101000000",
        source: "schema_migrations",
      },
    ],
    dataCoverage: {
      lastRefresh: generatedAt,
      coveragePercent: 80,
      connectedCount: 12,
      totalCatalogCount: 15,
      available: [
        { id: "core_health", label: "Core health", category: "x", status: "connected", summary: "ok", checkedAt: generatedAt },
        { id: "supabase_db", label: "DB", category: "x", status: "connected", summary: "ok", checkedAt: generatedAt },
      ],
      unavailable: [],
    },
    romaStatus: [],
    knownReports: [],
    dataSources: { available: [], unavailable: [] },
    ...overrides,
  };
}

describe("buildRomaEngineeringIntelligence", () => {
  it("returns READY when probes are healthy", () => {
    const result = buildRomaEngineeringIntelligence(baseDashboard());
    expect(result.releaseDecision).toBe("ready");
    expect(result.releaseDecisionLabel).toBe("READY");
    expect(result.confidenceScore).toBe("high");
  });

  it("reasons storage failure into release not recommended", () => {
    const dashboard = baseDashboard({
      systemComponents: [
        {
          id: "storage",
          name: "Storage",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "Storage API error: denied",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "database",
          name: "Database",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("not_ready");
    expect(result.topRisks.some((r) => r.id === "storage_impact")).toBe(true);
    expect(result.reasoning.some((r) => r.includes("upload"))).toBe(true);
    expect(result.recommendations.some((r) => r.includes("storage"))).toBe(true);
  });

  it("allows release with warnings when OpenAI is missing but core is healthy", () => {
    const dashboard = baseDashboard({
      systemComponents: [
        {
          id: "ai",
          name: "AI",
          status: "not_configured",
          statusLabel: "Not Configured",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "No AI provider configured.",
        },
        {
          id: "storage",
          name: "Storage",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "database",
          name: "Database",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
      ],
      recommendations: [
        {
          id: "openai_missing",
          title: "OpenAI API key not configured",
          component: "AI",
          severity: "warning",
          evidence: "Health probe reports no OPENAI_API_KEY.",
        },
      ],
      knownRisks: [
        {
          title: "AI provider not fully configured",
          component: "AI",
          severity: "warning",
          recommendation: "Set OPENAI_API_KEY.",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("ready_with_warnings");
    expect(result.topRisks.some((r) => r.id === "openai_missing")).toBe(true);
    expect(result.recommendations.some((r) => r.includes("OPENAI_API_KEY"))).toBe(true);
  });

  it("blocks release on critical env missing", () => {
    const dashboard = baseDashboard({
      recommendations: [
        {
          id: "env_missing_CRON_SECRET",
          title: "Required environment variable missing: CRON_SECRET",
          component: "Security",
          severity: "critical",
          evidence: "Release env validation verdict=FAIL.",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("not_ready");
    expect(result.topRisks.some((r) => r.id === "env_missing_CRON_SECRET")).toBe(true);
  });

  it("uses LOW confidence when data coverage is insufficient", () => {
    const dashboard = baseDashboard({
      dataCoverage: {
        lastRefresh: "2026-07-03T12:00:00.000Z",
        coveragePercent: 20,
        connectedCount: 3,
        totalCatalogCount: 15,
        available: [],
        unavailable: [
          {
            id: "core_health",
            label: "Core health",
            category: "x",
            status: "unavailable",
            summary: "unavailable",
            checkedAt: "2026-07-03T12:00:00.000Z",
          },
        ],
      },
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.confidenceScore).toBe("low");
    expect(result.topRisks.some((r) => r.id === "low_data_coverage")).toBe(true);
  });

  it("flags migration review when migration evidence is unavailable", () => {
    const dashboard = baseDashboard({
      platformTimeline: [
        {
          id: "last_migration",
          label: "Last migration",
          timestamp: null,
          displayValue: "Unavailable",
          source: "schema_migrations",
        },
      ],
      recommendations: [
        {
          id: "migration_probe_blocked",
          title: "Cannot verify database migration state",
          component: "Database",
          severity: "information",
          evidence: "SUPABASE_SERVICE_ROLE_KEY missing.",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("ready_with_warnings");
    expect(result.topRisks.some((r) => r.id === "migration_review")).toBe(true);
    expect(result.topRisks.find((r) => r.id === "migration_review")?.confidence).toBe("high");
  });

  it("shows NOT READY when critical blockers exist", () => {
    const dashboard = baseDashboard({
      recommendations: [
        {
          id: "env_missing_CRON_SECRET",
          title: "Required environment variable missing: CRON_SECRET",
          component: "Security",
          severity: "critical",
          evidence: "Release env validation verdict=FAIL.",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("not_ready");
    expect(result.ownerSummary.criticalBlockersCount).toBeGreaterThan(0);
    expect(result.ownerSummary.releaseDecisionLabel).toBe("NOT READY");
  });

  it("shows READY WITH WARNINGS for non-critical OpenAI missing", () => {
    const dashboard = baseDashboard({
      systemComponents: [
        {
          id: "ai",
          name: "AI",
          status: "not_configured",
          statusLabel: "Not Configured",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "No AI provider configured.",
        },
        {
          id: "storage",
          name: "Storage",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "database",
          name: "Database",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
      ],
      recommendations: [
        {
          id: "openai_missing",
          title: "OpenAI API key not configured",
          component: "AI",
          severity: "warning",
          evidence: "Health probe reports no OPENAI_API_KEY.",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("ready_with_warnings");
    expect(result.ownerSummary.releaseDecisionLabel).toBe("READY WITH WARNINGS");
    expect(result.affectedProductAreas.find((a) => a.id === "ai_copilot")?.status).toBe("affected");
  });

  it("shows LOW confidence and UNKNOWN when coverage is low with probe gaps", () => {
    const dashboard = baseDashboard({
      dataCoverage: {
        lastRefresh: "2026-07-03T12:00:00.000Z",
        coveragePercent: 20,
        connectedCount: 3,
        totalCatalogCount: 15,
        available: [{ id: "feature_flags", label: "Flags", category: "x", status: "connected", summary: "ok", checkedAt: "2026-07-03T12:00:00.000Z" }],
        unavailable: [
          {
            id: "core_health",
            label: "Core health",
            category: "x",
            status: "unavailable",
            summary: "unavailable",
            checkedAt: "2026-07-03T12:00:00.000Z",
          },
          {
            id: "supabase_db",
            label: "DB",
            category: "x",
            status: "unavailable",
            summary: "unavailable",
            checkedAt: "2026-07-03T12:00:00.000Z",
          },
        ],
      },
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.confidenceScore).toBe("low");
    expect(result.ownerSummary.confidenceLabel).toBe("LOW");
    expect(result.releaseDecision).toBe("unknown");
    expect(result.ownerSummary.releaseDecisionLabel).toBe("UNKNOWN");
  });

  it("does not treat storage not_configured as NOT READY", () => {
    const dashboard = baseDashboard({
      systemComponents: [
        {
          id: "storage",
          name: "Storage",
          status: "not_configured",
          statusLabel: "Not Configured",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "SUPABASE_SERVICE_ROLE_KEY missing — probe skipped.",
        },
        {
          id: "ai",
          name: "AI",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "database",
          name: "Database",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "healthy",
          statusLabel: "Healthy",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "ok",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).not.toBe("not_ready");
    expect(result.affectedProductAreas.find((a) => a.id === "photo_media_upload")?.status).toBe("unknown");
  });

  it("limits decision reasons to at most five evidence-backed items", () => {
    const dashboard = baseDashboard({
      platformStatus: {
        overallHealth: "unavailable",
        overallHealthLabel: "Unavailable",
        releaseReadiness: "blocked",
        releaseReadinessPercent: 0,
        lastUpdated: "2026-07-03T12:00:00.000Z",
      },
      systemComponents: [
        {
          id: "database",
          name: "Database",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "db error",
        },
        {
          id: "storage",
          name: "Storage",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "storage error",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "health fail",
        },
      ],
      recommendations: [
        {
          id: "env_missing_CRON_SECRET",
          title: "Required environment variable missing: CRON_SECRET",
          component: "Security",
          severity: "critical",
          evidence: "Release env validation verdict=FAIL.",
        },
      ],
      dataCoverage: {
        lastRefresh: "2026-07-03T12:00:00.000Z",
        coveragePercent: 15,
        connectedCount: 2,
        totalCatalogCount: 15,
        available: [],
        unavailable: [
          {
            id: "core_health",
            label: "Core health",
            category: "x",
            status: "unavailable",
            summary: "unavailable",
            checkedAt: "2026-07-03T12:00:00.000Z",
          },
        ],
      },
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.decisionReasons.length).toBeLessThanOrEqual(5);
    expect(result.decisionReasons.length).toBeGreaterThan(0);
    for (const reason of result.decisionReasons) {
      expect(reason.evidence).toBeTruthy();
      expect(reason.title).toBeTruthy();
    }
  });

  it("provides coverage explanation and blind spots", () => {
    const dashboard = baseDashboard({
      dataCoverage: {
        lastRefresh: "2026-07-03T12:00:00.000Z",
        coveragePercent: 42,
        connectedCount: 6,
        totalCatalogCount: 15,
        available: [
          { id: "core_health", label: "Core health", category: "x", status: "connected", summary: "ok", checkedAt: "2026-07-03T12:00:00.000Z" },
        ],
        unavailable: [
          {
            id: "github_actions",
            label: "CI history",
            category: "x",
            status: "unavailable",
            summary: "not configured",
            checkedAt: "2026-07-03T12:00:00.000Z",
          },
        ],
      },
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.coverageExplanation).toMatch(/42%/);
    expect(result.coverageBlindSpots.length).toBeGreaterThan(0);
    expect(result.ownerSummary.evidenceCoveragePercent).toBe(42);
  });

  it("aggregates multiple failures with not_ready decision", () => {
    const dashboard = baseDashboard({
      platformStatus: {
        overallHealth: "unavailable",
        overallHealthLabel: "Unavailable",
        releaseReadiness: "blocked",
        releaseReadinessPercent: 0,
        lastUpdated: "2026-07-03T12:00:00.000Z",
      },
      systemComponents: [
        {
          id: "database",
          name: "Database",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "db error",
        },
        {
          id: "storage",
          name: "Storage",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "storage error",
        },
        {
          id: "backend_api",
          name: "Backend API",
          status: "unavailable",
          statusLabel: "Unavailable",
          lastCheck: "2026-07-03T12:00:00.000Z",
          details: "health fail",
        },
      ],
    });
    const result = buildRomaEngineeringIntelligence(dashboard);
    expect(result.releaseDecision).toBe("not_ready");
    expect(result.topRisks.length).toBeGreaterThan(1);
    expect(result.actionPlan.length).toBeGreaterThan(1);
  });
});
