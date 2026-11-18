import { describe, expect, it, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

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

const { resolvePortalIntakeTenant } = vi.hoisted(() => ({
  resolvePortalIntakeTenant: vi.fn(),
}));
const { updateCustomerIntakeDraft } = vi.hoisted(() => ({
  updateCustomerIntakeDraft: vi.fn(),
}));

vi.mock("@/lib/domain/customer-intake/portal-intake-tenant", () => ({
  resolvePortalIntakeTenant,
}));
vi.mock("@/lib/domain/customer-intake/customer-intake.service", () => ({
  updateCustomerIntakeDraft,
}));

describe("PATCH /api/v1/portal/intake/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePortalIntakeTenant.mockResolvedValue({ tenantId: "t1" });
    updateCustomerIntakeDraft.mockResolvedValue({
      data: { id: "d1", title: "Kitchen 2", description: "Need remodel", status: "draft" },
      error: "",
    });
  });

  it("returns 401 when tenant is required", async () => {
    const { requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError();
    });
    const res = await PATCH(
      new Request("https://test/api/v1/portal/intake/d1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Kitchen 2" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(401);
    expect(updateCustomerIntakeDraft).not.toHaveBeenCalled();
  });

  it("rejects tenant_id rewrite", async () => {
    updateCustomerIntakeDraft.mockResolvedValueOnce({
      data: null,
      error: "tenant_id is immutable",
    });
    const res = await PATCH(
      new Request("https://test/api/v1/portal/intake/d1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: "t2", title: "Kitchen 2" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tenant_id is immutable/);
  });

  it("returns 403 when the draft is not writable for this creator", async () => {
    updateCustomerIntakeDraft.mockResolvedValueOnce({ data: null, error: "Update denied" });
    const res = await PATCH(
      new Request("https://test/api/v1/portal/intake/d1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Kitchen 2" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("updates a draft for the authenticated portal tenant", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/portal/intake/d1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Kitchen 2" }),
      }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe("d1");
    expect(updateCustomerIntakeDraft).toHaveBeenCalled();
    expect(updateCustomerIntakeDraft.mock.calls[0][1].tenantId).toBe("t1");
    expect(updateCustomerIntakeDraft.mock.calls[0][2]).toBe("d1");
  });
});
