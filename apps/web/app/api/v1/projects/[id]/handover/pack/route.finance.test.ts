import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as pack from "@/lib/domain/project-handover/handover-pack.service";
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
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key) => key),
}));
vi.mock("@/lib/i18n/resolve-request-locale", () => ({
  resolveRequestLocale: vi.fn().mockReturnValue("en"),
}));
vi.mock("@/lib/domain/project-handover/project-handover.policy", () => ({
  canManageProjectHandover: vi.fn(),
  canReadProjectHandover: vi.fn(),
}));
vi.mock("@/lib/domain/project-handover/handover-pack.service", () => ({
  buildManagerHandoverPack: vi.fn(),
  buildOwnerHandoverPack: vi.fn(),
}));

describe("GET /api/v1/projects/:id/handover/pack finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe owner pack", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(false);
    vi.mocked(policy.canReadProjectHandover).mockResolvedValue(true);
    vi.mocked(pack.buildOwnerHandoverPack).mockResolvedValue({
      data: { sections: [{ title: "Docs", amount: 0 }] } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover/pack"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sections[0].title).toBe("Docs");
  });

  it("blocks owner pack finance leak of margin without leaking key or value", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(false);
    vi.mocked(policy.canReadProjectHandover).mockResolvedValue(true);
    vi.mocked(pack.buildOwnerHandoverPack).mockResolvedValue({
      data: { sections: [{ title: "X", margin: 1 }] } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover/pack"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "margin", injectedValue: 1 });
  });

  it("preserves manager pack internal finance fields without customer guard", async () => {
    vi.mocked(policy.canManageProjectHandover).mockResolvedValue(true);
    vi.mocked(pack.buildManagerHandoverPack).mockResolvedValue({
      data: { readiness: true, margin: 9, budget_pressure: "med" } as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/handover/pack"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.margin).toBe(9);
    expect(body.data.budget_pressure).toBe("med");
  });
});
