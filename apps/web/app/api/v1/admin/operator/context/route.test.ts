import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
}));

vi.mock("@/lib/api/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

describe("GET /api/v1/admin/operator/context", () => {
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

    const res = await GET(new Request("https://x/api/v1/admin/operator/context"));
    expect(res.status).toBe(401);
  });

  it("returns admin gate response when requireAdmin denies", async () => {
    const { requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    const { requireAdmin } = await import("@/lib/api/require-admin");
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "member",
    });
    requireTenant.mockImplementation(() => undefined);
    vi.mocked(requireAdmin).mockReturnValue(
      NextResponse.json({ error: "Admin required" }, { status: 403 }),
    );

    const res = await GET(new Request("https://x/api/v1/admin/operator/context"));
    expect(res.status).toBe(403);
  });

  it("returns tenant operator context for an admin", async () => {
    const { requireTenant, getTenantContextFromRequest } = tenant as unknown as {
      requireTenant: ReturnType<typeof vi.fn>;
      getTenantContextFromRequest: ReturnType<typeof vi.fn>;
    };
    const { requireAdmin } = await import("@/lib/api/require-admin");
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "admin",
    });
    requireTenant.mockImplementation(() => undefined);
    vi.mocked(requireAdmin).mockReturnValue(null);

    const res = await GET(new Request("https://x/api/v1/admin/operator/context"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { tenant_id: "t1", user_id: "u1", role: "admin" },
    });
  });
});
