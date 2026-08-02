import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as projects from "@/lib/domain/projects/project.service";
import * as timeline from "@/lib/domain/projects/stakeholder-activity-timeline.repository";
import * as stakeholders from "@/lib/domain/stakeholders/stakeholders.policy";
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
vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: vi.fn(),
}));
vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
}));
vi.mock("@/lib/domain/projects/stakeholder-activity-timeline.repository", () => ({
  getStakeholderActivityTimeline: vi.fn(),
  shapeManagerAudience: vi.fn((x) => x),
  shapeStakeholderAudience: vi.fn((x) => x),
}));

describe("GET /api/v1/projects/:id/stakeholder-activity finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe stakeholder activity", async () => {
    vi.mocked(projects.getProjectForInternalWorkspace).mockResolvedValue({ data: null, error: "no" });
    vi.mocked(stakeholders.canReadClientPortalView).mockResolvedValue(true);
    vi.mocked(timeline.getStakeholderActivityTimeline).mockResolvedValue([{ id: "a1", title: "Update" }]);
    vi.mocked(timeline.shapeStakeholderAudience).mockImplementation((rows) => rows);
    const res = await GET(new Request("https://test/api/v1/projects/p1/stakeholder-activity"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("stakeholder");
    expect(body.data[0].title).toBe("Update");
  });

  it("blocks stakeholder leak of budget_pressure without leaking key or value", async () => {
    vi.mocked(projects.getProjectForInternalWorkspace).mockResolvedValue({ data: null, error: "no" });
    vi.mocked(stakeholders.canReadClientPortalView).mockResolvedValue(true);
    vi.mocked(timeline.getStakeholderActivityTimeline).mockResolvedValue([{ id: "a1" }]);
    vi.mocked(timeline.shapeStakeholderAudience).mockImplementation((rows) =>
      rows.map((r) => ({ ...r, budget_pressure: "high" }))
    );
    const res = await GET(new Request("https://test/api/v1/projects/p1/stakeholder-activity"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "budget_pressure", injectedValue: "high" });
  });

  it("preserves manager activity internal finance fields without customer guard", async () => {
    vi.mocked(projects.getProjectForInternalWorkspace).mockResolvedValue({
      data: { id: "p1" } as never,
      error: null,
    });
    vi.mocked(timeline.getStakeholderActivityTimeline).mockResolvedValue([{ id: "a1" }]);
    vi.mocked(timeline.shapeManagerAudience).mockImplementation((rows) =>
      rows.map((r) => ({ ...r, budget_pressure: "high", margin: 2 }))
    );
    const res = await GET(new Request("https://test/api/v1/projects/p1/stakeholder-activity"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.audience).toBe("manager");
    expect(body.data[0].budget_pressure).toBe("high");
    expect(body.data[0].margin).toBe(2);
  });
});
