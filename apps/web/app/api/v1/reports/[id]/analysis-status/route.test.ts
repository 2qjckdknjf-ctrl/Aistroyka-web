import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const getTenantContextFromRequest = vi.fn();
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn();
const getReportById = vi.fn();
const listJobsByReportId = vi.fn();
const getAdminClient = vi.fn(() => null);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => getReportById(...args),
}));

vi.mock("@/lib/platform/jobs/job.repository", () => ({
  listJobsByReportId: (...args: unknown[]) => listJobsByReportId(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

describe("GET /api/v1/reports/:id/analysis-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "manager-1",
      role: "member",
      clientProfile: "ios_manager",
    });
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    getReportById.mockResolvedValue({ id: "report-1" });
  });

  it("does not count the report sentinel as an analyzed photo", async () => {
    listJobsByReportId.mockResolvedValue([
      { id: "report-job", type: "ai_analyze_report", status: "success" },
      { id: "media-ok", type: "ai_analyze_media", status: "success" },
      { id: "media-failed", type: "ai_analyze_media", status: "failed" },
    ]);

    const res = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status"),
      { params: Promise.resolve({ id: "report-1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("failed");
    expect(body.jobCount).toBe(3);
    expect(body.summary).toEqual({
      mediaTotal: 2,
      analyzed: 1,
      failed: 1,
    });
  });
});
