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
const getReportById = vi.fn();
const listJobsByReportId = vi.fn().mockResolvedValue([]);
const getAdminClient = vi.fn().mockReturnValue(null);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => getReportById(...args),
}));

vi.mock("@/lib/platform/jobs/job.repository", () => ({
  listJobsByReportId: (...args: unknown[]) => listJobsByReportId(...args),
}));

describe("GET /api/v1/reports/:id/analysis-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    getReportById.mockResolvedValue({ id: "report-1", user_id: "worker-1" });
    listJobsByReportId.mockResolvedValue([]);
    getAdminClient.mockReturnValue(null);
  });

  it("uses the request-bound Supabase client so Bearer-only workers can read own reports", async () => {
    const request = new Request("https://test/api/v1/reports/report-1/analysis-status", {
      headers: { Authorization: "Bearer token", "x-client": "ios_worker" },
    });

    const response = await GET(request, { params: Promise.resolve({ id: "report-1" }) });

    expect(response.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(getReportById).toHaveBeenCalledWith({ client: "request-bound" }, "report-1", "tenant-1");
  });

  it("keeps lite workers isolated from peer report analysis status", async () => {
    getReportById.mockResolvedValueOnce({ id: "report-1", user_id: "other-worker" });

    const response = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status", {
        headers: { Authorization: "Bearer token", "x-client": "ios_worker" },
      }),
      { params: Promise.resolve({ id: "report-1" }) }
    );

    expect(response.status).toBe(404);
    expect(listJobsByReportId).not.toHaveBeenCalled();
  });
});
