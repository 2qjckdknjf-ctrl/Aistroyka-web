import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => {
  const tenantContext = {
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "ios_worker",
    traceId: "trace",
  };
  return {
    tenantContext,
    createWorkerReportedIssue: vi.fn(),
    storeLiteIdempotency: vi.fn(),
  };
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue(mocks.tenantContext),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ client: "request" }),
}));

vi.mock("@/lib/domain/issues/issue.service", () => ({
  listIssues: vi.fn(),
  createWorkerReportedIssue: (...args: unknown[]) => mocks.createWorkerReportedIssue(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: vi.fn().mockResolvedValue({ ok: true }),
  storeLiteIdempotency: (...args: unknown[]) => mocks.storeLiteIdempotency(...args),
}));

describe("POST /api/v1/worker/issues evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeLiteIdempotency.mockResolvedValue(undefined);
    mocks.createWorkerReportedIssue.mockResolvedValue({
      data: { id: "i1", project_id: "p1", title: "Fence", evidence_upload_session_id: "s1" },
      error: "",
    });
  });

  it("trims and forwards evidence_upload_session_id on create", async () => {
    const response = await POST(
      new Request("https://test/api/v1/worker/issues", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "issue-evidence-1" },
        body: JSON.stringify({
          project_id: "p1",
          title: "Fence",
          evidence_upload_session_id: "  s1  ",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createWorkerReportedIssue).toHaveBeenCalledWith(
      { client: "request" },
      mocks.tenantContext,
      expect.objectContaining({ evidence_upload_session_id: "s1" })
    );
    expect(mocks.storeLiteIdempotency).toHaveBeenCalled();
  });

  it("returns 400 when the evidence session fails the domain security contract", async () => {
    mocks.createWorkerReportedIssue.mockResolvedValueOnce({ data: null, error: "Invalid issue evidence" });

    const response = await POST(
      new Request("https://test/api/v1/worker/issues", {
        method: "POST",
        headers: { "content-type": "application/json", "x-idempotency-key": "issue-evidence-2" },
        body: JSON.stringify({
          project_id: "p1",
          title: "Fence",
          evidence_upload_session_id: "foreign-session",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid issue evidence" });
    expect(mocks.storeLiteIdempotency).not.toHaveBeenCalled();
  });
});
