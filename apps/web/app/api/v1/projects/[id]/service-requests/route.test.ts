import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as policy from "@/lib/domain/aftercare/aftercare.policy";
import * as svc from "@/lib/domain/aftercare/aftercare.service";

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
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/aftercare/aftercare.policy", () => ({
  canManageAftercareRequests: vi.fn(),
  canReportAftercareAsStakeholder: vi.fn(),
}));
vi.mock("@/lib/domain/aftercare/aftercare.service", () => ({
  listServiceRequests: vi.fn(),
  createServiceRequestManager: vi.fn(),
  createServiceRequestStakeholder: vi.fn(),
}));

describe("GET/POST /api/v1/projects/:id/service-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list when service succeeds", async () => {
    vi.mocked(svc.listServiceRequests).mockResolvedValue({
      data: [
        {
          id: "r1",
          title: "Leak",
          status: "reported",
          coverage_type: "warranty_review_needed",
          due_date: null,
          updated_at: "",
        },
      ],
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/service-requests");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].id).toBe("r1");
  });

  it("POST uses manager path when canManageAftercareRequests", async () => {
    vi.mocked(policy.canManageAftercareRequests).mockResolvedValue(true);
    vi.mocked(svc.createServiceRequestManager).mockResolvedValue({
      data: {
        id: "r1",
        title: "X",
        status: "reported",
        coverage_type: "warranty_review_needed",
        due_date: null,
        updated_at: "",
      },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(svc.createServiceRequestManager).toHaveBeenCalled();
    expect(svc.createServiceRequestStakeholder).not.toHaveBeenCalled();
  });

  it("POST uses stakeholder path when not manager but can report", async () => {
    vi.mocked(policy.canManageAftercareRequests).mockResolvedValue(false);
    vi.mocked(policy.canReportAftercareAsStakeholder).mockResolvedValue(true);
    vi.mocked(svc.createServiceRequestStakeholder).mockResolvedValue({
      data: {
        id: "r2",
        title: "Y",
        status: "reported",
        coverage_type: "warranty_review_needed",
        due_date: null,
        updated_at: "",
      },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Y" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(svc.createServiceRequestStakeholder).toHaveBeenCalled();
  });
});
