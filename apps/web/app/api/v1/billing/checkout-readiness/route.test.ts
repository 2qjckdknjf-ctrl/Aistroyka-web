import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  authorize: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/platform/billing-readiness/billing-readiness.service", () => ({
  createBillingCheckoutSessionService: vi.fn(),
}));

describe("POST /api/v1/billing/checkout-readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when tenant context is missing", async () => {
    const { TenantRequiredError, requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      TenantRequiredError: new (message?: string) => Error;
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    getTenantContextFromRequest.mockResolvedValue({ tenantId: null, userId: null });
    requireTenant.mockImplementation(() => {
      throw new TenantRequiredError("Unauthorized");
    });

    const res = await POST(
      new Request("https://x/api/v1/billing/checkout-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller lacks billing:admin", async () => {
    const { requireTenant, getTenantContextFromRequest, authorize } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
      authorize: ReturnType<typeof vi.fn>;
    };
    getTenantContextFromRequest.mockResolvedValue({ tenantId: "t1", userId: "u1" });
    requireTenant.mockImplementation(() => undefined);
    authorize.mockReturnValue(false);

    const res = await POST(
      new Request("https://x/api/v1/billing/checkout-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 503 when admin client is unavailable", async () => {
    const { requireTenant, getTenantContextFromRequest, authorize } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
      authorize: ReturnType<typeof vi.fn>;
    };
    const { getAdminClient } = await import("@/lib/supabase/admin");
    getTenantContextFromRequest.mockResolvedValue({ tenantId: "t1", userId: "u1" });
    requireTenant.mockImplementation(() => undefined);
    authorize.mockReturnValue(true);
    vi.mocked(getAdminClient).mockReturnValue(null);

    const res = await POST(
      new Request("https://x/api/v1/billing/checkout-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(503);
  });
});
