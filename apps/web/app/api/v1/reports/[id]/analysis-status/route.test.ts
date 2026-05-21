import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const liteTenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "pro",
  clientProfile: "ios_lite",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(liteTenantContext);
const requireTenant = vi.fn();
const createClient = vi.fn().mockResolvedValue({ client: "supabase" });
const getAdminClient = vi.fn().mockReturnValue(null);
const getReportById = vi.fn();
const canReviewReport = vi.fn().mockReturnValue(false);
const listJobsByReportId = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => getReportById(...args),
}));

vi.mock("@/lib/domain/reports/report.policy", () => ({
  canReviewReport: (...args: unknown[]) => canReviewReport(...args),
}));

vi.mock("@/lib/platform/jobs/job.repository", () => ({
  listJobsByReportId: (...args: unknown[]) => listJobsByReportId(...args),
}));

describe("GET /api/v1/reports/:id/analysis-status", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(liteTenantContext);
    requireTenant.mockReset();
    createClient.mockResolvedValue({ client: "supabase" });
    getAdminClient.mockReturnValue(null);
    getReportById.mockReset();
    canReviewReport.mockReturnValue(false);
    listJobsByReportId.mockResolvedValue([]);
  });

  it("hides peer reports from lite worker clients", async () => {
    getReportById.mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "other-worker",
      status: "submitted",
    });

    const response = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status"),
      { params: Promise.resolve({ id: "report-1" }) }
    );

    expect(response.status).toBe(404);
    expect(listJobsByReportId).not.toHaveBeenCalled();
  });

  it("returns status for the lite worker's own report", async () => {
    getReportById.mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "worker-1",
      status: "submitted",
    });

    const response = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status"),
      { params: Promise.resolve({ id: "report-1" }) }
    );

    expect(response.status).toBe(200);
    expect(listJobsByReportId).toHaveBeenCalledWith(
      expect.anything(),
      "report-1",
      "tenant-1"
    );
    await expect(response.json()).resolves.toMatchObject({
      status: "queued",
      reportId: "report-1",
      jobCount: 0,
    });
  });
});
