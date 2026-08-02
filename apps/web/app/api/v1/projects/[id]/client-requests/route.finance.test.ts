import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import * as clientRequests from "@/lib/domain/client-requests/client-requests.service";
import * as policy from "@/lib/domain/client-requests/client-requests.policy";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

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
vi.mock("@/lib/domain/client-requests/client-requests.policy", () => ({
  canManageClientRequests: vi.fn(),
}));
vi.mock("@/lib/domain/client-requests/client-requests.service", () => ({
  listClientRequests: vi.fn(),
  createClientRequest: vi.fn(),
}));
vi.mock("@/lib/domain/stakeholder-notifications/stakeholder-notifications.emit", () => ({
  emitClientRequestCreatedForStakeholders: vi.fn(),
}));
vi.mock("@/lib/platform/telegram/telegram-notifications.emit", () => ({
  emitTelegramForNewClientRequest: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

describe("GET|POST /api/v1/projects/:id/client-requests finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder list", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(false);
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", title: "Approve" }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].title).toBe("Approve");
  });

  it("blocks stakeholder leak of profitability without leaking key or value", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(false);
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", title: "X", profitability: 0.2 }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "profitability", injectedValue: 0.2 });
  });

  it("preserves manager GET internal finance fields without customer guard", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    vi.mocked(clientRequests.listClientRequests).mockResolvedValue({
      data: [{ id: "r1", title: "X", profitability: 0.2, margin: 5 }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/client-requests"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].profitability).toBe(0.2);
    expect(body.data[0].margin).toBe(5);
  });

  it("preserves manager POST create payload fields", async () => {
    vi.mocked(clientRequests.createClientRequest).mockResolvedValue({
      data: { id: "r1", title: "Hello", internal_note: "mgr" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "feedback", title: "Hello" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("r1");
    expect(body.data.title).toBe("Hello");
  });
});
