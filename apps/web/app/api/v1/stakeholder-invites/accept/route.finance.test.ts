import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as stakeholders from "@/lib/domain/stakeholders/stakeholders.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
  getSessionUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@example.com" }),
}));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/domain/stakeholders/stakeholders.service", () => ({
  acceptStakeholderInvite: vi.fn(),
}));
vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
}));

describe("POST /api/v1/stakeholder-invites/accept finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe accept payload with redirect_path", async () => {
    vi.mocked(stakeholders.acceptStakeholderInvite).mockResolvedValue({
      data: { tenant_id: "t1", project_id: "p1" } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/stakeholder-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.project_id).toBe("p1");
    expect(body.data.redirect_path).toBe("/dashboard/projects/p1/client");
  });

  it("blocks finance leak of internal_cost_item_id without leaking key or value", async () => {
    vi.mocked(stakeholders.acceptStakeholderInvite).mockResolvedValue({
      data: {
        tenant_id: "t1",
        project_id: "p1",
        internal_cost_item_id: "x",
      } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/stakeholder-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "tok" }),
    });
    const res = await POST(req);
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "internal_cost_item_id", injectedValue: "x" });
  });
});
