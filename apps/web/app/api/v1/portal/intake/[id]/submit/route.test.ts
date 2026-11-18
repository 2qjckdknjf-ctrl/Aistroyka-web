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
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

const { resolvePortalIntakeTenant } = vi.hoisted(() => ({
  resolvePortalIntakeTenant: vi.fn(),
}));
const { submitCustomerIntakeDraft } = vi.hoisted(() => ({
  submitCustomerIntakeDraft: vi.fn(),
}));

vi.mock("@/lib/domain/customer-intake/portal-intake-tenant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/domain/customer-intake/portal-intake-tenant")>();
  return {
    ...actual,
    resolvePortalIntakeTenant,
  };
});
vi.mock("@/lib/domain/customer-intake/customer-intake.service", () => ({
  submitCustomerIntakeDraft,
}));

describe("POST /api/v1/portal/intake/:id/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvePortalIntakeTenant.mockResolvedValue({ tenantId: "t1" });
    submitCustomerIntakeDraft.mockResolvedValue({
      data: { id: "d1", status: "submitted", title: "Kitchen", description: "Need remodel" },
      error: "",
    });
  });

  it("returns 401 without tenant", async () => {
    const { requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError();
    });
    const res = await POST(new Request("https://test/api/v1/portal/intake/d1/submit", { method: "POST" }), {
      params: Promise.resolve({ id: "d1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when the draft is not writable", async () => {
    submitCustomerIntakeDraft.mockResolvedValueOnce({ data: null, error: "Update denied" });
    const res = await POST(new Request("https://test/api/v1/portal/intake/d1/submit", { method: "POST" }), {
      params: Promise.resolve({ id: "d1" }),
    });
    expect(res.status).toBe(403);
  });

  it("forwards a project_id query when the stakeholder submit has no tenant header", async () => {
    resolvePortalIntakeTenant.mockResolvedValueOnce({
      error: "x-tenant-id or project_id is required for portal intake",
      status: 400,
    });
    const res = await POST(
      new Request("https://test/api/v1/portal/intake/d1/submit?project_id=p9", { method: "POST" }),
      { params: Promise.resolve({ id: "d1" }) }
    );
    expect(res.status).toBe(400);
    expect(resolvePortalIntakeTenant.mock.calls[0][3]).toBe("p9");
    expect(submitCustomerIntakeDraft).not.toHaveBeenCalled();
  });

  it("submits a draft for the resolved tenant", async () => {
    const res = await POST(new Request("https://test/api/v1/portal/intake/d1/submit", { method: "POST" }), {
      params: Promise.resolve({ id: "d1" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.status).toBe("submitted");
    expect(submitCustomerIntakeDraft.mock.calls[0][1].tenantId).toBe("t1");
    expect(submitCustomerIntakeDraft.mock.calls[0][2]).toBe("d1");
  });
});
