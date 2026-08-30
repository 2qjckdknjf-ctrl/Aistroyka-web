import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

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
const listIssues = vi.fn().mockResolvedValue({ data: [{ id: "iss-1", title: "Fence" }], error: "" });
const createWorkerReportedIssue = vi.fn().mockResolvedValue({ data: { id: "iss-2", title: "New" }, error: "" });
const requireLiteIdempotency = vi.fn().mockResolvedValue({ ok: true });
const storeLiteIdempotency = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/issues/issue.service", () => ({
  listIssues: (...args: unknown[]) => listIssues(...args),
  createWorkerReportedIssue: (...args: unknown[]) => createWorkerReportedIssue(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: (...args: unknown[]) => requireLiteIdempotency(...args),
  storeLiteIdempotency: (...args: unknown[]) => storeLiteIdempotency(...args),
}));

describe("GET/POST /api/v1/worker/issues", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    listIssues.mockClear();
    createWorkerReportedIssue.mockClear();
    requireLiteIdempotency.mockResolvedValue({ ok: true });
  });

  it("lists issues for a project", async () => {
    const res = await GET(new Request("https://test/api/v1/worker/issues?project_id=proj-1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data[0]?.id).toBe("iss-1");
    expect(listIssues).toHaveBeenCalled();
  });

  it("requires project_id", async () => {
    const res = await GET(new Request("https://test/api/v1/worker/issues"));
    expect(res.status).toBe(400);
  });

  it("creates an issue with idempotency", async () => {
    const res = await POST(
      new Request("https://test/api/v1/worker/issues", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-1" },
        body: JSON.stringify({ project_id: "proj-1", title: "Unsecured fence" }),
      })
    );
    expect(res.status).toBe(201);
    expect(createWorkerReportedIssue).toHaveBeenCalled();
    expect(storeLiteIdempotency).toHaveBeenCalled();
  });

  it("binds a finalized evidence session when the worker attaches a photo", async () => {
    const res = await POST(
      new Request("https://test/api/v1/worker/issues", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-photo" },
        body: JSON.stringify({
          project_id: "proj-1",
          title: "Unsecured fence",
          evidence_upload_session_id: "  sess-issue-1  ",
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(createWorkerReportedIssue).toHaveBeenCalledWith(
      { client: "request-bound" },
      tenantContext,
      expect.objectContaining({
        project_id: "proj-1",
        title: "Unsecured fence",
        evidence_upload_session_id: "sess-issue-1",
      })
    );
  });
});
