import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
  createClientFromRequest: vi.fn(),
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
  createClientFromRequest: (...args: unknown[]) => mocks.createClientFromRequest(...args),
}));

describe("GET /api/v1/ai/requests lite gate", () => {
  beforeEach(() => {
    mocks.getTenantContextFromRequest.mockReset();
    mocks.createClientFromRequest.mockReset();
  });

  it("returns lite_client_path_forbidden before AI jobs query", async () => {
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "android_worker",
      traceId: "test",
      litePathForbidden: true,
    });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/v1/ai/requests", {
        headers: { "x-client": "android_worker" },
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "forbidden",
      code: "lite_client_path_forbidden",
    });
    expect(mocks.createClientFromRequest).not.toHaveBeenCalled();
  });
});
