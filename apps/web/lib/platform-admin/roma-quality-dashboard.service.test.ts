import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildRomaQualityDashboard } from "./roma-quality-dashboard.service";

vi.mock("@/lib/controllers/health", () => ({
  getHealthResponse: vi.fn(),
}));

vi.mock("@/lib/system/health.service", () => ({
  getSystemHealth: vi.fn(),
}));

vi.mock("@/lib/config/release-env", () => ({
  validateReleaseEnv: vi.fn(),
}));

vi.mock("@/lib/platform/billing-readiness/billing-adapter-registry", () => ({
  getBillingAdapterDiagnostics: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));

import { getHealthResponse } from "@/lib/controllers/health";
import { getSystemHealth } from "@/lib/system/health.service";
import { validateReleaseEnv } from "@/lib/config/release-env";
import { getBillingAdapterDiagnostics } from "@/lib/platform/billing-readiness/billing-adapter-registry";
import { getAdminClient } from "@/lib/supabase/admin";

const mockGetHealthResponse = vi.mocked(getHealthResponse);
const mockGetSystemHealth = vi.mocked(getSystemHealth);
const mockValidateReleaseEnv = vi.mocked(validateReleaseEnv);
const mockGetBillingAdapterDiagnostics = vi.mocked(getBillingAdapterDiagnostics);
const mockGetAdminClient = vi.mocked(getAdminClient);

function baseReleaseReport() {
  return {
    isProduction: false,
    criticalMissing: [],
    optionalMissing: [],
    forbiddenInProdSet: [],
    cronConfigured: true,
    aiConfigured: true,
    billingConfigured: false,
    pushConfigured: false,
    results: [],
    verdict: "PASS_WITH_WARNINGS" as const,
    verdictReason: "Optional not set",
  };
}

describe("buildRomaQualityDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://staging.aistroyka.ai";
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    process.env.NEXT_PUBLIC_BUILD_SHA = "abc1234567890";
    process.env.NEXT_PUBLIC_BUILD_TIME = "2026-07-03T12:00:00.000Z";
    delete process.env.OWNER_ALLOWED_HOSTS;
    delete process.env.APP_STORE_WORKER_URL;

    mockGetHealthResponse.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        db: "ok",
        aiConfigured: true,
        openaiConfigured: true,
        supabaseReachable: true,
        serviceRoleConfigured: true,
        buildStamp: { sha7: "abc1234", buildTime: "2026-07-03T12:00:00.000Z" },
      },
    });

    mockGetSystemHealth.mockResolvedValue({
      status: "ok",
      timestamp: "2026-07-03T12:00:00.000Z",
      services: {
        database: "ok",
        ai_brain: "ok",
        copilot: "ok",
        workflows: "ok",
        events: "ok",
        alerts: "ok",
      },
    });

    mockValidateReleaseEnv.mockReturnValue(baseReleaseReport());
    mockGetBillingAdapterDiagnostics.mockReturnValue({
      activeAdapterKind: "sandbox",
      providerKind: "sandbox",
      flagEnabled: false,
      configValid: true,
      fallbackReason: null,
      liveCheckoutEnabled: false,
      checkoutMode: "sandbox",
      webhookIngressEnabled: false,
      webhookConfigValid: false,
    });
    mockGetAdminClient.mockReturnValue(null);
  });

  it("returns read-only dashboard with live probes", async () => {
    const dashboard = await buildRomaQualityDashboard();
    expect(dashboard.pageMode).toBe("read_only");
    expect(dashboard.testExecutionEnabled).toBe(false);
    expect(dashboard.platformStatus.overallHealthLabel).toBe("Healthy");
    expect(dashboard.systemComponents.length).toBe(12);
    expect(dashboard.dataSources.available.length).toBeGreaterThan(0);
    expect(dashboard.dataSources.unavailable.length).toBeGreaterThan(0);
  });

  it("shows Unknown for performance readiness without fabricating percent", async () => {
    const dashboard = await buildRomaQualityDashboard();
    const performance = dashboard.releaseReadiness.find((c) => c.id === "performance");
    expect(performance?.percent).toBeNull();
    expect(performance?.level).toBe("unknown");
  });

  it("marks database unavailable when health db probe fails", async () => {
    mockGetHealthResponse.mockResolvedValue({
      status: 503,
      body: {
        ok: false,
        db: "error",
        aiConfigured: false,
        openaiConfigured: false,
        reason: "db_error",
      },
    });
    const dashboard = await buildRomaQualityDashboard();
    const database = dashboard.systemComponents.find((c) => c.id === "database");
    expect(database?.statusLabel).toBe("Unavailable");
    expect(dashboard.blockers.some((b) => b.severity === "critical")).toBe(true);
  });

  it("shows Unknown for branch when deploy ref env is absent", async () => {
    delete process.env.VERCEL_GIT_COMMIT_REF;
    delete process.env.GITHUB_REF_NAME;
    const dashboard = await buildRomaQualityDashboard();
    expect(dashboard.latestChanges.branch).toBeNull();
  });
});
