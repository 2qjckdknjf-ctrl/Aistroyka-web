import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

import { GET } from "./route";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantForbiddenError,
  TenantRequiredError,
} from "@/lib/tenant";

describe("GET /api/v1/ai/governed-actions/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "manager",
    } as never);
    vi.mocked(requireTenant).mockReturnValue(undefined as never);
  });

  it("requires an authenticated tenant context", async () => {
    vi.mocked(requireTenant).mockImplementation(() => {
      throw new TenantRequiredError("Tenant required");
    });

    const res = await GET(new Request("http://localhost/api/v1/ai/governed-actions/execute"));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Tenant required" });
  });

  it("rejects forbidden tenant access", async () => {
    vi.mocked(getTenantContextFromRequest).mockRejectedValue(new TenantForbiddenError("Forbidden"));

    const res = await GET(new Request("http://localhost/api/v1/ai/governed-actions/execute"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns the action catalog for authenticated tenants", async () => {
    const res = await GET(new Request("http://localhost/api/v1/ai/governed-actions/execute"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data.actions)).toBe(true);
    expect(body.data.actions.length).toBeGreaterThan(0);
  });
});
