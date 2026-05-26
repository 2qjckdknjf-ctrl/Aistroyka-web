import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as portalService from "@/lib/domain/portal/portal.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "stakeholder",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/domain/portal/portal.service", () => ({
  getPortalProjectProof: vi.fn(),
}));

describe("GET /api/v1/portal/projects/:id/proof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when payload contains forbidden finance keys", async () => {
    vi.mocked(portalService.getPortalProjectProof).mockResolvedValue({
      data: {
        mode: "share_link",
        message: "Proof details",
        budget_pressure: "high",
      } as never,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/proof"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(500);
  });

  it("returns 200 for safe payload", async () => {
    vi.mocked(portalService.getPortalProjectProof).mockResolvedValue({
      data: {
        mode: "share_link",
        message: "Proof details",
      } as never,
      error: "",
    });

    const res = await GET(new Request("https://test/api/v1/portal/projects/p1/proof"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(200);
  });
});
