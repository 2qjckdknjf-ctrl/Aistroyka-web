import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Tenant required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
  LitePathForbiddenError: class LitePathForbiddenError extends Error {
    constructor(message = "forbidden") {
      super(message);
      this.name = "LitePathForbiddenError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/lib/platform/plan-fit", () => ({
  getWorkspacePlanContextFromRuntime: vi.fn(),
}));

vi.mock("@/lib/platform/plan-fit/plan-surface", () => ({
  getPlanSurfaceViewModel: vi.fn((ctx: { canonicalPlanCode: string }) => ({
    currentPlanCode: ctx.canonicalPlanCode,
    humanReadablePlanName: "Team Contractor",
    sourceKind: "canonical_plan",
    sourceLabel: "Selected plan",
    planDescriptionShort: "For contractor teams.",
    limitsSummary: { maxUsers: 20, maxProjects: 15, maxStorageGb: 100, maxActiveMobileWorkers: 20, maxMonthlyAiRequests: 2000 },
    capabilityGroups: [],
    upgradeSuggestion: { ctaVariant: "see_business_options", ctaCopy: "Explore Business Operations", learnMoreCopy: "", suggestedPlanCode: "business_operations" },
    isEnterprise: false,
    isLegacyBridge: false,
  })),
  getPlanSurfaceFallback: vi.fn(() => ({
    currentPlanCode: "client_personal",
    humanReadablePlanName: "Client Personal",
    sourceKind: "canonical_plan",
    sourceLabel: "Default",
    planDescriptionShort: "For clients.",
    limitsSummary: { maxUsers: 2, maxProjects: 2, maxStorageGb: 10, maxActiveMobileWorkers: 0, maxMonthlyAiRequests: 100 },
    capabilityGroups: [],
    upgradeSuggestion: { ctaVariant: "explore_plans", ctaCopy: "Explore plan options", learnMoreCopy: "", suggestedPlanCode: "team_contractor" },
    isEnterprise: false,
    isLegacyBridge: false,
  })),
}));

describe("GET /api/v1/plan-fit/surface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when requireTenant throws", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({ tenantId: null, userId: null, role: null, subscriptionTier: null, clientProfile: "web", traceId: "t1" });
    vi.mocked(requireTenant).mockImplementation(() => {
      throw new TenantRequiredError("User has no tenant membership");
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("https://test/api/v1/plan-fit/surface"));
    expect(res.status).toBe(401);
  });

  it("returns surface when context is valid", async () => {
    const { getTenantContextFromRequest, requireTenant } = await import("@/lib/tenant");
    const { getWorkspacePlanContextFromRuntime } = await import("@/lib/platform/plan-fit");

    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "admin",
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t1",
    });
    vi.mocked(requireTenant).mockImplementation(() => {});
    vi.mocked(getWorkspacePlanContextFromRuntime).mockResolvedValue({
      workspaceId: "w1",
      canonicalPlanCode: "team_contractor",
      sourceKind: "canonical_plan",
      addOnCodes: [],
      effectiveEntitlements: { limits: {} as never, capabilities: {} as never },
      effectiveCapabilities: {} as never,
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("https://test/api/v1/plan-fit/surface"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.surface).toBeDefined();
    expect(json.surface.humanReadablePlanName).toBe("Team Contractor");
    expect(json.surface.currentPlanCode).toBe("team_contractor");
  });

  it("returns fallback when getWorkspacePlanContextFromRuntime throws", async () => {
    const { getTenantContextFromRequest, requireTenant } = await import("@/lib/tenant");
    const { getWorkspacePlanContextFromRuntime } = await import("@/lib/platform/plan-fit");

    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "admin",
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t1",
    });
    vi.mocked(requireTenant).mockImplementation(() => {});
    vi.mocked(getWorkspacePlanContextFromRuntime).mockRejectedValue(new Error("DB error"));

    const { GET } = await import("./route");
    const res = await GET(new Request("https://test/api/v1/plan-fit/surface"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.surface).toBeDefined();
    expect(json.fallback).toBe(true);
    expect(json.surface.humanReadablePlanName).toBe("Client Personal");
  });
});
