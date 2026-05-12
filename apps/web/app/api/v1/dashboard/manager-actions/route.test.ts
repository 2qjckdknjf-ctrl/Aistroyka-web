import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as managerActions from "@/lib/domain/dashboard/manager-actions.service";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/dashboard/manager-actions.service", () => ({
  buildManagerActions: vi.fn(),
}));

describe("GET /api/v1/dashboard/manager-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns manager action feed for internal managers", async () => {
    vi.mocked(managerActions.buildManagerActions).mockResolvedValue({
      counts: { low: 0, medium: 0, high: 0, critical: 1 },
      items: [
        {
          id: "manager:budget:p1",
          type: "internal_cost_overrun",
          severity: "critical",
          title: "Budget over planned — Build",
          reason: "Actual costs exceed planned total for this project.",
          project_id: "p1",
          project_name: "Build",
          href: "/dashboard/projects/p1?tab=costs",
          recommended_action: "Open the internal Costs tab.",
          visibility: "internal_manager_only",
        },
      ],
    });

    const res = await GET(new Request("https://test/api/v1/dashboard/manager-actions"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.items[0].visibility).toBe("internal_manager_only");
    expect(body.data.items[0].type).toBe("internal_cost_overrun");
  });

  it("rejects portal-only stakeholder/customer roles", async () => {
    vi.mocked(tenant.getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "stakeholder-user",
      role: "stakeholder",
      subscriptionTier: "free",
      clientProfile: "web",
      traceId: "trace1",
    } as never);

    const res = await GET(new Request("https://test/api/v1/dashboard/manager-actions"));

    expect(res.status).toBe(403);
    expect(managerActions.buildManagerActions).not.toHaveBeenCalled();
  });
});
