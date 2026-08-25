import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const listDocuments = vi.fn().mockResolvedValue({
  data: [
    { id: "doc-1", title: "KJ-07", object_path: "https://files.example/kj-07.pdf" },
    { id: "doc-2", title: "Act", object_path: "tenant-1/proj-1/documents/act.pdf" },
  ],
  error: "",
});
const resolveOpenUrl = vi.fn(async (_supabase: unknown, _tenantId: string, path?: string | null) => {
  if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
  if (path === "tenant-1/proj-1/documents/act.pdf") return "https://signed.example/act.pdf";
  return null;
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
}));

vi.mock("@/lib/domain/documents/worker-document-open-url", () => ({
  resolveWorkerDocumentOpenUrl: (...args: unknown[]) => resolveOpenUrl(...args),
}));

describe("GET /api/v1/worker/documents", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    listDocuments.mockClear();
    resolveOpenUrl.mockClear();
  });

  it("lists documents for a project", async () => {
    const res = await GET(new Request("https://test/api/v1/worker/documents?project_id=proj-1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; open_url: string | null }[];
    };
    expect(body.data[0]?.id).toBe("doc-1");
    expect(body.data[0]?.open_url).toBe("https://files.example/kj-07.pdf");
    expect(body.data[1]?.open_url).toBe("https://signed.example/act.pdf");
  });

  it("requires project_id", async () => {
    const res = await GET(new Request("https://test/api/v1/worker/documents"));
    expect(res.status).toBe(400);
  });
});
