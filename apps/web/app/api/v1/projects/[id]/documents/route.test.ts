import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

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
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const listDocuments = vi.fn().mockResolvedValue({ data: [], error: "" });
const createDocument = vi.fn().mockResolvedValue({
  data: { id: "doc-1", status: "draft", type: "document", title: "Doc" },
  error: "",
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/documents/document.service", () => ({
  listDocuments: (...args: unknown[]) => listDocuments(...args),
  createDocument: (...args: unknown[]) => createDocument(...args),
}));

describe("GET/POST /api/v1/projects/:id/documents", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    listDocuments.mockResolvedValue({ data: [], error: "" });
    createDocument.mockResolvedValue({
      data: { id: "doc-1", status: "draft", type: "document", title: "Doc" },
      error: "",
    });
  });

  it("returns 200 with project documents list", async () => {
    listDocuments.mockResolvedValueOnce({
      data: [{ id: "doc-1", status: "under_review", title: "Contract" }],
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/project-1/documents"), {
      params: Promise.resolve({ id: "project-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("returns 400 when create payload type is invalid", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "unknown", title: "X" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(400);
    expect(createDocument).not.toHaveBeenCalled();
  });

  it("returns 400 when create payload misses title", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "document", title: "   " }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when create fails due rights/tenant access", async () => {
    createDocument.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "document", title: "Doc" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns 201 when manager creates document metadata", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "contract",
          title: "Main contract",
          description: "Initial version",
        }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(201);
    expect(createDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "tenant-1", userId: "manager-1" }),
      expect.objectContaining({ project_id: "project-1", type: "contract", title: "Main contract" })
    );
  });
});

