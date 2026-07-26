import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  authorize: vi.fn(),
  getAdminClient: vi.fn(),
  getWorkspaceBillingOverview: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: mocks.getTenantContextFromRequest,
  requireTenant: mocks.requireTenant,
  authorize: mocks.authorize,
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Tenant required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: mocks.getAdminClient,
}));

vi.mock("@/lib/platform/billing-readiness/billing-readiness.service", () => ({
  getWorkspaceBillingOverview: mocks.getWorkspaceBillingOverview,
}));

import { GET } from "./route";

describe("GET /api/v1/billing/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenant.mockImplementation(() => undefined);
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "stakeholder",
    });
    mocks.authorize.mockReturnValue(false);
    mocks.getAdminClient.mockReturnValue({ from: vi.fn() });
    mocks.getWorkspaceBillingOverview.mockResolvedValue({ selectedPlan: null });
  });

  it("denies portal stakeholders and non-owners", async () => {
    const res = await GET(new Request("http://localhost/api/v1/billing/overview"));
    expect(res.status).toBe(403);
    expect(mocks.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ role: "stakeholder" }),
      "billing:admin"
    );
    expect(mocks.getWorkspaceBillingOverview).not.toHaveBeenCalled();
  });

  it("returns overview for billing admins", async () => {
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "owner-1",
      role: "owner",
    });
    mocks.authorize.mockReturnValue(true);
    mocks.getWorkspaceBillingOverview.mockResolvedValue({
      selectedPlan: { canonicalPlanCode: "client_personal" },
    });

    const res = await GET(new Request("http://localhost/api/v1/billing/overview"));
    expect(res.status).toBe(200);
    expect(mocks.getWorkspaceBillingOverview).toHaveBeenCalledWith(
      expect.anything(),
      "tenant-1"
    );
    await expect(res.json()).resolves.toEqual({
      selectedPlan: { canonicalPlanCode: "client_personal" },
    });
  });
});
