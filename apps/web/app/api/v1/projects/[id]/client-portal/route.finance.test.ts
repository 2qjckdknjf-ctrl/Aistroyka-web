import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";
import * as clientPortal from "@/lib/domain/client-portal/client-portal.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "admin",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/client-portal/client-portal.service", () => ({
  updateClientPortalSettings: vi.fn(),
}));

describe("PATCH /api/v1/projects/:id/client-portal finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe settings payload", async () => {
    vi.mocked(clientPortal.updateClientPortalSettings).mockResolvedValue({
      data: { client_portal_enabled: true },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_portal_enabled: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.client_portal_enabled).toBe(true);
  });

  it("blocks finance leak of cost_overrun without leaking key or value", async () => {
    vi.mocked(clientPortal.updateClientPortalSettings).mockResolvedValue({
      data: { client_portal_enabled: true, cost_overrun: true } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_portal_enabled: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "cost_overrun", injectedValue: true });
  });
});
