import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as handover from "@/lib/domain/project-handover/project-handover.service";
import * as policy from "@/lib/domain/project-handover/project-handover.policy";
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
vi.mock("@/lib/domain/project-handover/project-handover.policy", () => ({
  canManageProjectHandover: vi.fn(),
}));
vi.mock("@/lib/domain/project-handover/project-handover.service", () => ({
  getHandoverForManager: vi.fn(),
  getHandoverPublicSummary: vi.fn(),
}));

describe("GET /api/v1/projects/:id/handover finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder handover summary", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(false);
    vi.mocked(handover.getHandoverPublicSummary).mockResolvedValue({
      data: { status: "ready", title: "Handover" } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("stakeholder");
    expect(body.data.status).toBe("ready");
  });

  it("blocks stakeholder leak of budget_pressure without leaking key or value", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(false);
    vi.mocked(handover.getHandoverPublicSummary).mockResolvedValue({
      data: { status: "ready", budget_pressure: "high" } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_pressure", injectedValue: "high" });
  });

  it("preserves manager GET internal finance fields without customer guard", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(true);
    vi.mocked(handover.getHandoverForManager).mockResolvedValue({
      data: { status: "draft", budget_pressure: "high", margin: 4 } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("manager");
    expect(body.data.budget_pressure).toBe("high");
    expect(body.data.margin).toBe(4);
  });
});
