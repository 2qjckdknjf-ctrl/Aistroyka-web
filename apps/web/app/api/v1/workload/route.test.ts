import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import * as workload from "@/lib/domain/workload/workload.service";

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
    traceId: "x",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/domain/workload/workload.service", () => ({
  buildManagerWorkload: vi.fn(),
  buildStakeholderWorkload: vi.fn(),
  buildLeadershipWorkload: vi.fn(),
}));

describe("GET /api/v1/workload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to manager workload", async () => {
    vi.mocked(workload.buildManagerWorkload).mockResolvedValue({
      items: [],
      counts: { urgent: 0, high: 0, normal: 0 },
      audience: "manager",
    });
    const res = await GET(new Request("https://test/api/v1/workload"));
    expect(res.status).toBe(200);
    expect(workload.buildManagerWorkload).toHaveBeenCalled();
  });

  it("returns 400 for invalid audience", async () => {
    const res = await GET(new Request("https://test/api/v1/workload?audience=invalid"));
    expect(res.status).toBe(400);
  });

  it("calls stakeholder builder when audience=stakeholder", async () => {
    vi.mocked(workload.buildStakeholderWorkload).mockResolvedValue({
      items: [],
      counts: { urgent: 0, high: 0, normal: 0 },
      audience: "stakeholder",
    });
    const res = await GET(new Request("https://test/api/v1/workload?audience=stakeholder"));
    expect(res.status).toBe(200);
    expect(workload.buildStakeholderWorkload).toHaveBeenCalled();
  });

  it("calls leadership builder when audience=leadership", async () => {
    vi.mocked(workload.buildLeadershipWorkload).mockResolvedValue({
      items: [],
      counts: { urgent: 0, high: 0, normal: 0 },
      audience: "leadership",
    });
    const res = await GET(new Request("https://test/api/v1/workload?audience=leadership"));
    expect(res.status).toBe(200);
    expect(workload.buildLeadershipWorkload).toHaveBeenCalled();
  });
});
