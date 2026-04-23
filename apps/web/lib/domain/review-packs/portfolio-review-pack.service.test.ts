import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { buildPortfolioReviewPack } from "./portfolio-review-pack.service";
import type { PortfolioControlResult } from "@/lib/domain/portfolio/portfolio-control.types";

vi.mock("@/lib/domain/portfolio/portfolio-control.service", () => ({
  buildPortfolioControl: vi.fn(),
}));

vi.mock("@/lib/domain/governance/governance.repository", () => ({
  countOpenGovernanceCases: vi.fn().mockResolvedValue({ open: 0, criticalOpen: 0 }),
}));

vi.mock("@/lib/domain/commercial/commercial.repository", () => ({
  countTenantCommercialOverdue: vi.fn().mockResolvedValue({ overdueCount: 0, openUnpaidCount: 0 }),
}));

describe("buildPortfolioReviewPack", () => {
  const ctx: TenantContext = {
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "x",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shapes critical portfolio narrative and lists critical projects first", async () => {
    const { buildPortfolioControl } = await import("@/lib/domain/portfolio/portfolio-control.service");
    const mockRow = (id: string, name: string, state: "healthy" | "attention" | "critical") => ({
      id,
      name,
      portfolioState: state,
      derivedHealthLevel: "critical" as const,
      projectStatus: "at_risk",
      topBlockerCategory: "budget" as const,
      primaryReason: "test reason",
      signals: {
        overdueMilestonesCount: 0,
        pendingApprovalsCount: 0,
        pendingClientRequestsCount: 0,
        openChangeOrdersCount: 0,
        openDiscussionsCount: 0,
        blockingDefectsCount: 0,
        activeAftercareCount: 0,
        handoverBlockerCount: 0,
        handoverReady: false,
        budgetOverBudget: true,
        budgetNearingLimit: false,
        openIssuesCount: 0,
        pendingReportApprovalsCount: 0,
      },
      projectHref: `/dashboard/projects/${id}`,
    });

    const data: PortfolioControlResult = {
      projects: [mockRow("p1", "Alpha", "critical"), mockRow("p2", "Beta", "healthy")],
      distribution: { healthy: 1, attention: 0, critical: 1 },
      totalProjects: 2,
      limitedTo: 2,
    };
    vi.mocked(buildPortfolioControl).mockResolvedValue(data);

    const pack = await buildPortfolioReviewPack({} as SupabaseClient, ctx);
    expect(pack.header.executiveSignal).toBe("critical");
    expect(pack.header.narrative).toContain("critical");
    expect(pack.criticalProjects).toHaveLength(1);
    expect(pack.criticalProjects[0].name).toBe("Alpha");
    expect(pack.actionFocus.length).toBeGreaterThan(0);
  });
});
