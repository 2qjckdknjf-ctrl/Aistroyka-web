import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as policy from "@/lib/domain/defects/defects.policy";
import * as svc from "@/lib/domain/defects/defects.service";

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
vi.mock("@/lib/domain/defects/defects.policy", () => ({
  canManageDefects: vi.fn(),
  canReportDefectAsStakeholder: vi.fn(),
}));
vi.mock("@/lib/domain/defects/defects.service", () => ({
  listDefects: vi.fn(),
  createDefectManager: vi.fn(),
  createDefectStakeholder: vi.fn(),
}));

describe("GET/POST /api/v1/projects/:id/defects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list when service succeeds", async () => {
    vi.mocked(svc.listDefects).mockResolvedValue({
      data: [{ id: "d1", title: "T", status: "open", is_blocking: false, due_date: null, updated_at: "" }],
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/defects");
    const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].id).toBe("d1");
  });

  it("POST uses manager path when canManageDefects", async () => {
    vi.mocked(policy.canManageDefects).mockResolvedValue(true);
    vi.mocked(svc.createDefectManager).mockResolvedValue({
      data: { id: "d1", title: "X", status: "open", is_blocking: false, due_date: null, updated_at: "" },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/defects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(svc.createDefectManager).toHaveBeenCalled();
    expect(svc.createDefectStakeholder).not.toHaveBeenCalled();
  });

  it("POST uses stakeholder path when not manager but can report", async () => {
    vi.mocked(policy.canManageDefects).mockResolvedValue(false);
    vi.mocked(policy.canReportDefectAsStakeholder).mockResolvedValue(true);
    vi.mocked(svc.createDefectStakeholder).mockResolvedValue({
      data: { id: "d2", title: "Y", status: "open", is_blocking: true, due_date: null, updated_at: "" },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/defects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Y", is_blocking: true }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(svc.createDefectStakeholder).toHaveBeenCalled();
  });
});
