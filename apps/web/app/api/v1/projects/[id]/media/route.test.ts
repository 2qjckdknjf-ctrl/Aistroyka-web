import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

let tenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace-1",
};

const supabase = { client: "request-bound" };
const getTenantContextFromRequest = vi.fn(async () => tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn(async () => supabase);
const getProjectForInternalWorkspace = vi.fn();
const getProjectWithAccess = vi.fn();
const listByProject = vi.fn();
const resolveAIMediaImage = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: (...args: unknown[]) => getProjectForInternalWorkspace(...args),
}));

vi.mock("@/lib/domain/projects/project-access", () => ({
  getProjectWithAccess: (...args: unknown[]) => getProjectWithAccess(...args),
}));

vi.mock("@/lib/domain/media/media.repository", () => ({
  listByProject: (...args: unknown[]) => listByProject(...args),
}));

vi.mock("@/lib/tenant/client-profile", () => ({
  isLiteWorkerClient: (ctx: { clientProfile?: string }) =>
    ["ios_lite", "android_lite", "ios_worker", "android_worker"].includes(ctx.clientProfile ?? ""),
}));

vi.mock("@/lib/platform/ai/resolve-ai-media-image", () => ({
  resolveAIMediaImage: (...args: unknown[]) => resolveAIMediaImage(...args),
}));

function request(limit = 50) {
  return new Request(`https://test/api/v1/projects/project-a/media?limit=${limit}`);
}

const params = { params: Promise.resolve({ id: "project-a" }) };

describe("GET /api/v1/projects/:id/media", () => {
  beforeEach(() => {
    tenantContext = {
      tenantId: "tenant-1",
      userId: "worker-1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "ios_worker",
      traceId: "trace-1",
    };
    vi.clearAllMocks();
    getProjectWithAccess.mockResolvedValue({ project: { id: "project-a" }, error: null });
    getProjectForInternalWorkspace.mockResolvedValue({ data: { id: "project-a" }, error: null });
    listByProject.mockResolvedValue([]);
    resolveAIMediaImage.mockResolvedValue({
      ok: true,
      imageUrl: "https://signed.example/photo",
      source: "media",
      objectPath: "tenant-1/photo.jpg",
      trustedProjectId: "project-a",
    });
  });

  it("hides another project from a lite Worker without active membership", async () => {
    getProjectWithAccess.mockResolvedValue({ project: null, error: "Project not found" });

    const res = await GET(request(), params);

    expect(res.status).toBe(404);
    expect(listByProject).not.toHaveBeenCalled();
    expect(resolveAIMediaImage).not.toHaveBeenCalled();
  });

  it("returns only one signed image to an assigned lite Worker", async () => {
    listByProject.mockResolvedValue([
      {
        id: "doc-1",
        project_id: "project-a",
        tenant_id: "tenant-1",
        type: "document",
        file_url: "tenant-1/contract.pdf",
      },
      {
        id: "photo-1",
        project_id: "project-a",
        tenant_id: "tenant-1",
        type: "site_photo",
        file_url: "tenant-1/site.jpg",
      },
    ]);

    const res = await GET(request(50), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "photo-1",
      file_url: "https://signed.example/photo",
    });
    expect(listByProject).toHaveBeenCalledWith(
      supabase,
      "project-a",
      "tenant-1",
      { limit: 12 }
    );
    expect(resolveAIMediaImage).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        tenantId: "tenant-1",
        mediaId: "photo-1",
        projectIdClaim: "project-a",
      })
    );
  });

  it("keeps the existing manager catalog behavior", async () => {
    tenantContext = { ...tenantContext, role: "admin", clientProfile: "ios_manager" };
    const rows = [
      {
        id: "doc-1",
        project_id: "project-a",
        tenant_id: "tenant-1",
        type: "document",
        file_url: "raw/path.pdf",
      },
    ];
    listByProject.mockResolvedValue(rows);

    const res = await GET(request(3), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(rows);
    expect(getProjectForInternalWorkspace).toHaveBeenCalled();
    expect(getProjectWithAccess).not.toHaveBeenCalled();
    expect(listByProject).toHaveBeenCalledWith(
      supabase,
      "project-a",
      "tenant-1",
      { limit: 3 }
    );
  });
});
