import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
  getById: vi.fn(),
  getProjectEstimateSummary: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: mocks.getTenantContextFromRequest,
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: mocks.getById,
}));

vi.mock("@/lib/domain/estimate/estimate.service", () => ({
  getProjectEstimateSummary: mocks.getProjectEstimateSummary,
}));

describe("GET /api/v1/projects/:id/estimate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getById.mockResolvedValue({ id: "p1" });
    mocks.getProjectEstimateSummary.mockResolvedValue({
      project_id: "p1",
      tenant_id: "t1",
      budget_summary: null,
      latest_estimate_result: null,
      estimate_results: [],
      source_documents: [],
    });
  });

  it("returns 403 for stakeholder role", async () => {
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
      role: "stakeholder",
    });

    const res = await GET(new Request("https://test/api/v1/projects/p1/estimate"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(403);
    expect(mocks.getById).not.toHaveBeenCalled();
    expect(mocks.getProjectEstimateSummary).not.toHaveBeenCalled();
  });

  it("returns 200 for member role", async () => {
    mocks.getTenantContextFromRequest.mockResolvedValue({
      tenantId: "t1",
      userId: "u2",
      role: "member",
    });

    const res = await GET(new Request("https://test/api/v1/projects/p1/estimate"), {
      params: Promise.resolve({ id: "p1" }),
    });

    expect(res.status).toBe(200);
    expect(mocks.getById).toHaveBeenCalled();
    expect(mocks.getProjectEstimateSummary).toHaveBeenCalled();
  });
});
