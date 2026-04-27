import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as portfolioControl from "@/lib/domain/portfolio/portfolio-control.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "x",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/domain/portfolio/portfolio-control.service", () => ({
  buildPortfolioControl: vi.fn(),
}));

describe("GET /api/v1/portfolio/control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns portfolio control payload", async () => {
    vi.mocked(portfolioControl.buildPortfolioControl).mockResolvedValue({
      projects: [],
      distribution: { healthy: 0, attention: 0, critical: 0 },
      totalProjects: 0,
      limitedTo: 0,
    });
    const res = await GET(new Request("https://test/api/v1/portfolio/control"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.distribution).toEqual({ healthy: 0, attention: 0, critical: 0 });
  });
});
