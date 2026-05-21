import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const canManageProjects = vi.fn().mockReturnValue(true);
const getProjectById = vi.fn().mockResolvedValue({ id: "project-1" });
const getDocumentById = vi.fn().mockResolvedValue({
  id: "doc-1",
  tenant_id: "tenant-1",
  project_id: "project-1",
  status: "draft",
});
const updateDocument = vi.fn().mockResolvedValue({
  data: { id: "doc-1", status: "uploaded", object_path: "tenant/t1/project/p1/documents/f1.pdf" },
  error: "",
});

const hoisted = vi.hoisted(() => {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const getPublicUrl = vi
    .fn()
    .mockReturnValue({ data: { publicUrl: "https://example.com/file.pdf" } });
  const supabaseClient = {
    storage: {
      from: vi.fn(() => ({
        upload: (...args: unknown[]) => upload(...args),
        remove: (...args: unknown[]) => remove(...args),
        getPublicUrl: (...args: unknown[]) => getPublicUrl(...args),
      })),
    },
  };
  return { upload, remove, getPublicUrl, supabaseClient };
});

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue(hoisted.supabaseClient),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canManageProjects: (...args: unknown[]) => canManageProjects(...args),
}));

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: (...args: unknown[]) => getProjectById(...args),
}));

vi.mock("@/lib/domain/documents/document.repository", () => ({
  getById: (...args: unknown[]) => getDocumentById(...args),
}));

vi.mock("@/lib/domain/documents/document.service", () => ({
  updateDocument: (...args: unknown[]) => updateDocument(...args),
}));

describe("POST /api/v1/projects/:id/documents/:documentId/upload", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    canManageProjects.mockReturnValue(true);
    getProjectById.mockResolvedValue({ id: "project-1" });
    getDocumentById.mockResolvedValue({
      id: "doc-1",
      tenant_id: "tenant-1",
      project_id: "project-1",
      status: "draft",
    });
    updateDocument.mockResolvedValue({
      data: { id: "doc-1", status: "uploaded", object_path: "tenant/t1/project/p1/documents/f1.pdf" },
      error: "",
    });
    hoisted.upload.mockResolvedValue({ error: null });
    hoisted.remove.mockResolvedValue({ error: null });
  });

  it("returns 403 when caller cannot manage project documents", async () => {
    canManageProjects.mockReturnValueOnce(false);
    const req = new Request("https://test/api/v1/projects/project-1/documents/doc-1/upload", {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "project-1", documentId: "doc-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when document does not belong to requested project", async () => {
    getDocumentById.mockResolvedValueOnce({
      id: "doc-1",
      tenant_id: "tenant-1",
      project_id: "project-2",
      status: "draft",
    });
    const form = new FormData();
    form.set("file", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));
    const req = new Request("https://test/api/v1/projects/project-1/documents/doc-1/upload", {
      method: "POST",
      body: form,
    });
    const res = await POST(req, { params: Promise.resolve({ id: "project-1", documentId: "doc-1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 when document status is not draft", async () => {
    getDocumentById.mockResolvedValueOnce({
      id: "doc-1",
      tenant_id: "tenant-1",
      project_id: "project-1",
      status: "under_review",
    });
    const form = new FormData();
    form.set("file", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));
    const req = new Request("https://test/api/v1/projects/project-1/documents/doc-1/upload", {
      method: "POST",
      body: form,
    });
    const res = await POST(req, { params: Promise.resolve({ id: "project-1", documentId: "doc-1" }) });
    expect(res.status).toBe(400);
  });

  it("uploads and sets document status to uploaded", async () => {
    const form = new FormData();
    form.set("file", new File(["pdf"], "handover.pdf", { type: "application/pdf" }));
    const req = new Request("https://test/api/v1/projects/project-1/documents/doc-1/upload", {
      method: "POST",
      body: form,
    });
    const res = await POST(req, { params: Promise.resolve({ id: "project-1", documentId: "doc-1" }) });
    expect(res.status).toBe(200);
    expect(hoisted.upload).toHaveBeenCalled();
    expect(updateDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "tenant-1", userId: "manager-1" }),
      "doc-1",
      "project-1",
      expect.objectContaining({ status: "uploaded" })
    );
    const body = await res.json();
    expect(body.data.document.status).toBe("uploaded");
  });
});

