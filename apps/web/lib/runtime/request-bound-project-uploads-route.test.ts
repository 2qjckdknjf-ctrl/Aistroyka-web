import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/projects/[id]/uploads/route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "android_full",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const mockClasses = vi.hoisted(() => {
  class TenantRequiredError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return { TenantRequiredError };
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: mockClasses.TenantRequiredError,
}));

const requestBoundClient = { client: "request-bound" };
const createClientFromRequest = vi.fn().mockResolvedValue(requestBoundClient);
const createClient = vi.fn().mockResolvedValue({ client: "cookie-only" });

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
  createClient: (...args: unknown[]) => createClient(...args),
}));

const getProject = vi.fn().mockResolvedValue({ data: { id: "project-1" }, error: null });
vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: (...args: unknown[]) => getProject(...args),
}));

const listProjectUploads = vi.fn().mockResolvedValue({ rows: [], total: 0 });
vi.mock("@/lib/domain/projects/project-scoped.repository", () => ({
  listProjectUploads: (...args: unknown[]) => listProjectUploads(...args),
}));

describe("GET /api/v1/projects/:id/uploads", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    getProject.mockResolvedValue({ data: { id: "project-1" }, error: null });
    listProjectUploads.mockResolvedValue({ rows: [], total: 0 });
    createClientFromRequest.mockClear();
    createClient.mockClear();
    getProject.mockClear();
    listProjectUploads.mockClear();
  });

  it("uses request-bound Supabase client for Bearer-auth project upload reads", async () => {
    const request = new Request("https://test/api/v1/projects/project-1/uploads?limit=10&offset=0", {
      headers: { Authorization: "Bearer user.jwt" },
    });

    const res = await GET(request, { params: Promise.resolve({ id: "project-1" }) });

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
    expect(getProject).toHaveBeenCalledWith(requestBoundClient, expect.objectContaining({ tenantId: "tenant-1" }), "project-1");
    expect(listProjectUploads).toHaveBeenCalledWith(requestBoundClient, "tenant-1", "project-1", {
      limit: 10,
      offset: 0,
    });
  });

  it("preserves cookie-session requests by still using request-bound client helper", async () => {
    const request = new Request("https://test/api/v1/projects/project-1/uploads");

    const res = await GET(request, { params: Promise.resolve({ id: "project-1" }) });

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("still rejects missing auth or tenant membership before DB reads", async () => {
    requireTenant.mockImplementationOnce(() => {
      throw new mockClasses.TenantRequiredError("Authentication required");
    });
    const request = new Request("https://test/api/v1/projects/project-1/uploads");

    const res = await GET(request, { params: Promise.resolve({ id: "project-1" }) });

    expect(res.status).toBe(401);
    expect(createClientFromRequest).not.toHaveBeenCalled();
    expect(getProject).not.toHaveBeenCalled();
    expect(listProjectUploads).not.toHaveBeenCalled();
  });

  it("preserves tenant/project denial when project access is forbidden", async () => {
    getProject.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const request = new Request("https://test/api/v1/projects/other-project/uploads", {
      headers: { Authorization: "Bearer user.jwt" },
    });

    const res = await GET(request, { params: Promise.resolve({ id: "other-project" }) });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Insufficient rights" });
    expect(listProjectUploads).not.toHaveBeenCalled();
  });
});
