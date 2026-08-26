import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";

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
const getIssueById = vi.fn().mockResolvedValue({
  data: { id: "iss-1", project_id: "proj-1", title: "Fence", status: "open" },
  error: "",
});
const updateWorkerReportedIssue = vi.fn().mockResolvedValue({
  data: { id: "iss-1", project_id: "proj-1", title: "Fence", status: "in_review" },
  error: "",
});
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
  getIssueById: (...args: unknown[]) => getIssueById(...args),
  updateWorkerReportedIssue: (...args: unknown[]) => updateWorkerReportedIssue(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: (...args: unknown[]) => requireLiteIdempotency(...args),
  storeLiteIdempotency: (...args: unknown[]) => storeLiteIdempotency(...args),
}));

describe("GET /api/v1/worker/issues/:issueId", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    getIssueById.mockClear();
  });

  it("returns the issue for inbox deep-link", async () => {
    const res = await GET(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=proj-1"),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe("iss-1");
  });
});

describe("PATCH /api/v1/worker/issues/:issueId", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    getIssueById.mockClear();
    updateWorkerReportedIssue.mockClear();
    requireLiteIdempotency.mockResolvedValue({ ok: true });
  });

  it("sends a worker issue for review", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=proj-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-2" },
        body: JSON.stringify({ status: "in_review", description: "Fixed fence" }),
      }),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updateWorkerReportedIssue).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "iss-1",
      expect.objectContaining({ status: "in_review", description: "Fixed fence" })
    );
    expect(storeLiteIdempotency).toHaveBeenCalled();
  });

  it("accepts evidence_upload_session_id", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=proj-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-ev" },
        body: JSON.stringify({ status: "in_review", evidence_upload_session_id: "sess-1" }),
      }),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updateWorkerReportedIssue).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "iss-1",
      expect.objectContaining({ evidence_upload_session_id: "sess-1" })
    );
  });

  it("rejects resolve/close before the service runs", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=proj-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-res" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(403);
    expect(updateWorkerReportedIssue).not.toHaveBeenCalled();
  });

  it("returns 409 when the issue is already closed", async () => {
    updateWorkerReportedIssue.mockResolvedValueOnce({ data: null, error: "Issue is closed" });
    const res = await PATCH(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=proj-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-closed" },
        body: JSON.stringify({ status: "in_review" }),
      }),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(409);
  });

  it("rejects a project mismatch", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/issues/iss-1?project_id=other", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-3" },
        body: JSON.stringify({ status: "in_review" }),
      }),
      { params: Promise.resolve({ issueId: "iss-1" }) }
    );
    expect(res.status).toBe(404);
    expect(updateWorkerReportedIssue).not.toHaveBeenCalled();
  });
});
