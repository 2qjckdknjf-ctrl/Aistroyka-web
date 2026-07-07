import { describe, expect, it } from "vitest";
import {
  buildRomaQualityDashboardFromProbes,
} from "./roma-quality-dashboard.service";
import type { LiveProbeBundle } from "./roma-live-probes";

function makeProbeBundle(overrides?: Partial<LiveProbeBundle>): LiveProbeBundle {
  const checkedAt = "2026-07-03T12:00:00.000Z";
  return {
    checkedAt,
    health: {
      connected: true,
      summary: "ok",
      data: {
        status: 200,
        ok: true,
        db: "ok",
        aiConfigured: true,
        openaiConfigured: true,
        supabaseReachable: true,
        serviceRoleConfigured: true,
        buildSha7: "abc1234",
        buildTime: checkedAt,
        reason: null,
      },
      error: null,
    },
    systemHealth: {
      connected: true,
      summary: "ok",
      data: {
        status: "ok",
        timestamp: checkedAt,
        services: {
          database: "ok",
          ai_brain: "ok",
          copilot: "ok",
          workflows: "ok",
          events: "ok",
          alerts: "ok",
        },
      },
      error: null,
    },
    releaseEnv: {
      connected: true,
      summary: "PASS",
      data: {
        isProduction: false,
        criticalMissing: [],
        optionalMissing: [],
        forbiddenInProdSet: [],
        cronConfigured: true,
        aiConfigured: true,
        billingConfigured: false,
        pushConfigured: false,
        results: [],
        verdict: "PASS_WITH_WARNINGS",
        verdictReason: "ok",
      },
      error: null,
    },
    gitMetadata: {
      connected: true,
      summary: "branch main",
      data: {
        branch: "security/platform-admin-separation",
        sha: "abc1234567890",
        buildTime: checkedAt,
        githubRunId: null,
        githubWorkflow: null,
        githubRepository: null,
        githubEvent: null,
      },
      error: null,
    },
    storage: {
      connected: true,
      summary: "storage ok",
      data: {
        status: "healthy",
        bucketCount: 1,
        hasMediaBucket: true,
        details: "media bucket present",
      },
      error: null,
    },
    featureFlags: {
      connected: true,
      summary: "3 flags",
      data: { count: 3, keys: ["a", "b", "c"] },
      error: null,
    },
    migrations: {
      connected: true,
      summary: "latest v1",
      data: { latestVersion: "20260101000000", migrationCount: 10 },
      error: null,
    },
    platformAudit: {
      connected: true,
      summary: "audit ok",
      data: { latestAction: "view", latestAt: checkedAt },
      error: null,
    },
    billing: {
      connected: true,
      summary: "sandbox",
      data: {
        adapter: {
          activeAdapterKind: "sandbox",
          providerKind: "sandbox",
          flagEnabled: false,
          configValid: true,
          fallbackReason: null,
          liveCheckoutEnabled: false,
          checkoutMode: "sandbox",
          webhookIngressEnabled: false,
          webhookConfigValid: false,
        },
        runtime: {
          providerKind: "sandbox",
          stripeConfig: null,
          flagEnabled: false,
          configValid: true,
          fallbackReason: null,
          liveCheckoutEnabled: false,
          webhookIngressEnabled: false,
        },
        priceMappingsConfigured: 0,
        priceMappingsTotal: 4,
        webhookIngress: { enabled: false, webhookSecretValid: false, reason: "off" },
      },
      error: null,
    },
    ai: {
      connected: true,
      summary: "openai",
      data: {
        openai: true,
        aiJob: false,
        visionProviders: ["openai"],
        gemini: false,
        copilotModel: "gpt-4o-mini",
      },
      error: null,
    },
    cloudflare: {
      connected: false,
      summary: "skipped local",
      data: {
        appUrl: "http://localhost:3001",
        externalHealthOk: null,
        externalBuildSha7: null,
        runtimeHint: null,
      },
      error: null,
    },
    mobile: {
      connected: false,
      summary: "no mobile env",
      data: {
        iosWorkerUrl: null,
        iosManagerUrl: null,
        androidWorkerUrl: null,
        androidManagerUrl: null,
        androidVersionCode: null,
        iosBuildNumber: null,
      },
      error: "mobile_metadata_missing",
    },
    ...overrides,
  };
}

describe("buildRomaQualityDashboardFromProbes", () => {
  it("returns live operations dashboard with data coverage", () => {
    const dashboard = buildRomaQualityDashboardFromProbes(makeProbeBundle());
    expect(dashboard.pageMode).toBe("read_only");
    expect(dashboard.testExecutionEnabled).toBe(false);
    expect(dashboard.dataCoverage.totalCatalogCount).toBeGreaterThan(0);
    expect(dashboard.dataCoverage.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(dashboard.domainSections.length).toBe(7);
    expect(dashboard.platformTimeline.length).toBe(5);
  });

  it("does not fabricate recommendations when probes are healthy", () => {
    const dashboard = buildRomaQualityDashboardFromProbes(makeProbeBundle());
    expect(dashboard.recommendations.some((r) => r.id === "openai_missing")).toBe(false);
  });

  it("generates evidence-based recommendations from probe failures", () => {
    const dashboard = buildRomaQualityDashboardFromProbes(
      makeProbeBundle({
        health: {
          connected: true,
          summary: "degraded",
          data: {
            status: 200,
            ok: true,
            db: "ok",
            aiConfigured: false,
            openaiConfigured: false,
            supabaseReachable: true,
            serviceRoleConfigured: false,
            buildSha7: null,
            buildTime: null,
            reason: null,
          },
          error: null,
        },
        releaseEnv: {
          connected: true,
          summary: "warn",
          data: {
            isProduction: false,
            criticalMissing: [],
            optionalMissing: ["OPENAI_API_KEY"],
            forbiddenInProdSet: [],
            cronConfigured: true,
            aiConfigured: false,
            billingConfigured: false,
            pushConfigured: false,
            results: [],
            verdict: "PASS_WITH_WARNINGS",
            verdictReason: "AI missing",
          },
          error: null,
        },
        gitMetadata: {
          connected: true,
          summary: "no stamp",
          data: {
            branch: null,
            sha: null,
            buildTime: null,
            githubRunId: null,
            githubWorkflow: null,
            githubRepository: null,
            githubEvent: null,
          },
          error: null,
        },
      })
    );
    expect(dashboard.recommendations.some((r) => r.id === "openai_missing")).toBe(true);
    expect(dashboard.recommendations.some((r) => r.id === "build_stamp_missing")).toBe(true);
  });
});
