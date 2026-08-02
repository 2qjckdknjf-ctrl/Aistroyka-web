import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as policy from "@/lib/domain/client-requests/client-requests.policy";
import * as notifRepo from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.repository";
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
  canStakeholderAccessClientRequests: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/domain/stakeholder-notifications/stakeholder-notifications.repository", () => ({
  listForUser: vi.fn(),
  unreadCount: vi.fn(),
  rowToPublic: vi.fn(),
}));

describe("GET /api/v1/projects/:id/stakeholder-notifications finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe notification list", async () => {
    vi.mocked(notifRepo.listForUser).mockResolvedValue([{ id: "n1" }] as never);
    vi.mocked(notifRepo.unreadCount).mockResolvedValue(1);
    vi.mocked(notifRepo.rowToPublic).mockReturnValue({ id: "n1", title: "Hi" } as never);
    const res = await GET(new Request("https://test/api/v1/projects/p1/stakeholder-notifications"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].title).toBe("Hi");
    expect(body.unread).toBe(1);
  });

  it("blocks finance leak of budget_pressure without leaking key or value", async () => {
    vi.mocked(notifRepo.listForUser).mockResolvedValue([{ id: "n1" }] as never);
    vi.mocked(notifRepo.unreadCount).mockResolvedValue(1);
    vi.mocked(notifRepo.rowToPublic).mockReturnValue({
      id: "n1",
      title: "Hi",
      budget_pressure: "high",
    } as never);
    const res = await GET(new Request("https://test/api/v1/projects/p1/stakeholder-notifications"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_pressure", injectedValue: "high" });
  });
});
