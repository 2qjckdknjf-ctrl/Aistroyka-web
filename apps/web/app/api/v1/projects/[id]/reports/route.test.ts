import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "android_manager",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const getProject = vi.fn().mockResolvedValue({ data: { id: "project-1" }, error: null });
const listProjectReports = vi.fn().mockResolvedValue({ rows: [], total: 0 });

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: (...args: unknown[]) => getProject(...args),
}));

vi.mock("@/lib/domain/projects/project-scoped.repository", () => ({
  listProjectReports: (...args: unknown[]) => listProjectReports(...args),
}));

describe("GET /api/v1/projects/:id/reports", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    getProject.mockResolvedValue({ data: { id: "project-1" }, error: null });
    listProjectReports.mockResolvedValue({ rows: [], total: 0 });
  });

  it("uses the request-bound Supabase client for Bearer-only mobile manager requests", async () => {
    const request = new Request("https://test/api/v1/projects/project-1/reports", {
      headers: { Authorization: "Bearer token", "x-client": "android_manager" },
    });

    const response = await GET(request, { params: Promise.resolve({ id: "project-1" }) });

    expect(response.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(getProject).toHaveBeenCalledWith({ client: "request-bound" }, tenantContext, "project-1");
    expect(listProjectReports).toHaveBeenCalledWith({ client: "request-bound" }, "tenant-1", "project-1", {
      limit: 50,
      offset: 0,
    });
  });
});
