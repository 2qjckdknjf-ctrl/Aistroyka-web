import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_lite",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const submitReport = vi.fn().mockResolvedValue({
  ok: true,
  jobIds: ["job-1"],
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

vi.mock("@/lib/domain/reports/report.service", () => ({
  submitReport: (...args: unknown[]) => submitReport(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: (...args: unknown[]) => requireLiteIdempotency(...args),
  storeLiteIdempotency: (...args: unknown[]) => storeLiteIdempotency(...args),
}));

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: vi.fn((_request: Request, response: Response) => response),
}));

describe("POST /api/v1/worker/report/submit", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    createClientFromRequest.mockClear();
    submitReport.mockClear();
    requireLiteIdempotency.mockResolvedValue({ ok: true });
    storeLiteIdempotency.mockClear();
  });

  it("returns 400 when request body is invalid", async () => {
    const response = await POST(
      new Request("https://test/api/v1/worker/report/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeTruthy();
    expect(submitReport).not.toHaveBeenCalled();
  });

  it("returns queued payload and forwards normalized body", async () => {
    submitReport.mockResolvedValueOnce({ ok: true, jobIds: ["job-1", "job-2"] });
    const response = await POST(
      new Request("https://test/api/v1/worker/report/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client": "ios_lite",
          "x-idempotency-key": "k-1",
        },
        body: JSON.stringify({
          report_id: "report-1",
          task_id: "task-1",
          worker_note: "  note from worker  ",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalled();
    expect(submitReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "tenant-1", userId: "worker-1" }),
      "report-1",
      "trace-1",
      { taskId: "task-1", workerNote: "note from worker" }
    );
    expect(storeLiteIdempotency).toHaveBeenCalled();
    expect(await response.json()).toEqual({
      reportId: "report-1",
      jobIds: ["job-1", "job-2"],
      status: "queued",
    });
  });
});

