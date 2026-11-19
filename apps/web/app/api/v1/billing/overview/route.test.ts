import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Tenant required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/platform/billing-readiness/billing-readiness.service", () => ({
  getWorkspaceBillingOverview: vi.fn().mockResolvedValue({ plan: "free", ready: false }),
}));

describe("GET /api/v1/billing/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when tenant context is required but missing", async () => {
    const { TenantRequiredError, requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      TenantRequiredError: new (message?: string) => Error;
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    getTenantContextFromRequest.mockResolvedValue({ tenantId: null, userId: null });
    requireTenant.mockImplementation(() => {
      throw new TenantRequiredError("Unauthorized");
    });

    const res = await GET(new Request("https://x/api/v1/billing/overview"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when tenantId is absent after requireTenant", async () => {
    const { requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    getTenantContextFromRequest.mockResolvedValue({ tenantId: null, userId: "u1" });
    requireTenant.mockImplementation(() => undefined);

    const res = await GET(new Request("https://x/api/v1/billing/overview"));
    expect(res.status).toBe(403);
  });

  it("returns 503 when admin client is unavailable", async () => {
    const { requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    const { getAdminClient } = await import("@/lib/supabase/admin");
    getTenantContextFromRequest.mockResolvedValue({ tenantId: "t1", userId: "u1" });
    requireTenant.mockImplementation(() => undefined);
    vi.mocked(getAdminClient).mockReturnValue(null);

    const res = await GET(new Request("https://x/api/v1/billing/overview"));
    expect(res.status).toBe(503);
  });
});
