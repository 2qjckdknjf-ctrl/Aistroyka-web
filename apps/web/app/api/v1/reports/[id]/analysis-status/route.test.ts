import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const { getReportById, listJobsByReportId } = vi.hoisted(() => ({
  getReportById: vi.fn(),
  listJobsByReportId: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
  LitePathForbiddenError: class LitePathForbiddenError extends Error {
    constructor(message = "forbidden") {
      super(message);
      this.name = "LitePathForbiddenError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ kind: "request-client" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => getReportById(...args),
}));

vi.mock("@/lib/platform/jobs/job.repository", () => ({
  listJobsByReportId: (...args: unknown[]) => listJobsByReportId(...args),
}));

const params = { params: Promise.resolve({ id: "report-1" }) };

describe("GET /api/v1/reports/:id/analysis-status", () => {
  beforeEach(() => {
    getReportById.mockReset();
    listJobsByReportId.mockReset();
    getReportById.mockResolvedValue({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    listJobsByReportId.mockResolvedValue([]);
  });

  it("returns 401 when tenant context is absent", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import(
      "@/lib/tenant"
    );
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "trace-absent",
    });
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError("Authentication required");
    });

    const res = await GET(new Request("https://test/api/v1/reports/report-1/analysis-status"), params);

    expect(res.status).toBe(401);
    expect(getReportById).not.toHaveBeenCalled();
  });

  it("returns 404 and does not disclose jobs when a lite worker requests a peer report", async () => {
    const { getTenantContextFromRequest } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "ios_worker",
      traceId: "trace-lite",
    });
    getReportById.mockResolvedValueOnce({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "peer-user",
    });

    const res = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status", {
        headers: { "x-client": "ios_worker" },
      }),
      params,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Report not found" });
    expect(listJobsByReportId).not.toHaveBeenCalled();
  });

  it("returns status for a lite worker's own report", async () => {
    const { getTenantContextFromRequest } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "android_lite",
      traceId: "trace-lite",
    });

    const res = await GET(
      new Request("https://test/api/v1/reports/report-1/analysis-status", {
        headers: { "x-client": "android_lite" },
      }),
      params,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "queued",
      reportId: "report-1",
      jobCount: 0,
      summary: null,
    });
    expect(listJobsByReportId).toHaveBeenCalledWith(
      expect.anything(),
      "report-1",
      "tenant-1",
    );
  });

  it("preserves tenant-wide manager status reads for non-lite clients", async () => {
    getReportById.mockResolvedValueOnce({
      id: "report-1",
      tenant_id: "tenant-1",
      user_id: "peer-user",
    });
    listJobsByReportId.mockResolvedValueOnce([
      { type: "ai_analyze_media", status: "success" },
    ]);

    const res = await GET(new Request("https://test/api/v1/reports/report-1/analysis-status"), params);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "success",
      reportId: "report-1",
      jobCount: 1,
      summary: { mediaTotal: 1, analyzed: 1, failed: 0 },
    });
  });
});
