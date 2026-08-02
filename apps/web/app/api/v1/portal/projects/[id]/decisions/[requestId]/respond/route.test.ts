import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
import { enforceCustomerFinanceOnJsonResponse } from "@/lib/security/customer-finance-response";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
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
vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  respondToClientRequest: vi.fn(),
}));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
}));

describe("POST /api/v1/portal/projects/:id/decisions/:requestId/respond", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe respond payload", async () => {
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { id: "r1", title: "Approve layout" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/portal/projects/p1/decisions/r1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Approve layout");
  });

  it("blocks finance leak of margin without leaking key or value", async () => {
    vi.mocked(clientRequests.respondToClientRequest).mockResolvedValue({
      data: { title: "Approve layout", margin: 12 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/portal/projects/p1/decisions/r1/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1", requestId: "r1" }) });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "margin", injectedValue: 12 });
  });

  it("alias wrapper preserves safe 200 headers and status via enforce helper", async () => {
    const payload = { data: { id: "r1", title: "OK" } };
    const upstream = NextResponse.json(payload, { status: 200 });
    upstream.headers.set("x-portal-alias", "decision-respond");
    const out = await enforceCustomerFinanceOnJsonResponse(
      "POST /api/v1/portal/projects/:id/decisions/:requestId/respond",
      upstream
    );
    expect(out).toBe(upstream);
    expect(out.status).toBe(200);
    expect(out.headers.get("x-portal-alias")).toBe("decision-respond");
    expect(await out.json()).toEqual(payload);
  });
});
