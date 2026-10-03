import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

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
}));

const { resolvePortalIntakeTenant } = vi.hoisted(() => ({
  resolvePortalIntakeTenant: vi.fn(),
}));

vi.mock("@/lib/domain/customer-intake/portal-intake-tenant", () => ({
  resolvePortalIntakeTenant,
}));

describe("POST /api/v1/portal/intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePortalIntakeTenant.mockResolvedValue({ tenantId: "t1" });
  });

  it("returns 400 for missing title", async () => {
    const res = await POST(
      new Request("https://test/api/v1/portal/intake", {
        method: "POST",
        body: JSON.stringify({ description: "x" }),
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/title/);
    expect(resolvePortalIntakeTenant).not.toHaveBeenCalled();
  });

  it("returns 400 for null title", async () => {
    const res = await POST(
      new Request("https://test/api/v1/portal/intake", {
        method: "POST",
        body: JSON.stringify({ title: null, description: "x" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-string description", async () => {
    const res = await POST(
      new Request("https://test/api/v1/portal/intake", {
        method: "POST",
        body: JSON.stringify({ title: "Kitchen", description: ["x"] }),
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/description/);
  });

  it("returns 400 when a stakeholder omits tenant and project context", async () => {
    resolvePortalIntakeTenant.mockResolvedValue({
      error: "x-tenant-id or project_id is required for portal intake",
      status: 400,
    });
    const res = await POST(
      new Request("https://test/api/v1/portal/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Kitchen", description: "Remodel" }),
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/x-tenant-id or project_id/);
  });
});
