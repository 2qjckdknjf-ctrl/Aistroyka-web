import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
  getMetricsOverview: vi.fn(),
  createClient: vi.fn(),
}));

class TenantRequiredError extends Error {}
class LitePathForbiddenError extends Error {}

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => mocks.getTenantContextFromRequest(...args),
  requireTenant: (ctx: { litePathForbidden?: boolean; tenantId?: string | null }) => {
    if (ctx.litePathForbidden) throw new LitePathForbiddenError();
    if (!ctx.tenantId) throw new TenantRequiredError("Authentication required");
  },
  TenantRequiredError,
  LitePathForbiddenError,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
}));

vi.mock("@/lib/observability/metrics.service", () => ({
  getMetricsOverview: (...args: unknown[]) => mocks.getMetricsOverview(...args),
}));

describe("GET /api/v1/admin/metrics/overview lite gate", () => {
  beforeEach(() => {
    mocks.getTenantContextFromRequest.mockReset();
    mocks.getMetricsOverview.mockReset();
    mocks.createClient.mockReset();
  });

  it("returns lite_client_path_forbidden and never calls metrics service", async () => {
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "ios_worker",
      traceId: "test",
      litePathForbidden: true,
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/v1/admin/metrics/overview", {
        headers: { "x-client": "ios_worker" },
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "forbidden",
      code: "lite_client_path_forbidden",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getMetricsOverview).not.toHaveBeenCalled();
  });
});
