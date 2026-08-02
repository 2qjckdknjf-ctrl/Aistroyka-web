import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

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
const canReviewReport = vi.fn().mockReturnValue(true);
const isLiteWorkerClient = vi.fn().mockReturnValue(false);
const getProject = vi.fn().mockResolvedValue({ data: { id: "project-1" }, error: null });
const generateReportsExportCsv = vi.fn().mockResolvedValue("report_id,project_id\r\nreport-1,project-1\r\n");

const hoisted = vi.hoisted(() => ({
  TenantRequiredError: class TenantRequiredError extends Error {},
  LitePathForbiddenError: class LitePathForbiddenError extends Error {},
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: hoisted.TenantRequiredError,
  LitePathForbiddenError: hoisted.LitePathForbiddenError,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/reports/report.policy", () => ({
  canReviewReport: (...args: unknown[]) => canReviewReport(...args),
}));

vi.mock("@/lib/tenant/client-profile", () => ({
  isLiteWorkerClient: (...args: unknown[]) => isLiteWorkerClient(...args),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: (...args: unknown[]) => getProject(...args),
}));

vi.mock("@/lib/domain/reports/report-export.service", () => ({
  generateReportsExportCsv: (...args: unknown[]) => generateReportsExportCsv(...args),
}));

describe("GET /api/v1/reports/export", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    canReviewReport.mockReset();
    canReviewReport.mockReturnValue(true);
    isLiteWorkerClient.mockReset();
    isLiteWorkerClient.mockReturnValue(false);
    getProject.mockClear();
    getProject.mockResolvedValue({ data: { id: "project-1" }, error: null });
    generateReportsExportCsv.mockClear();
    generateReportsExportCsv.mockResolvedValue("report_id,project_id\r\nreport-1,project-1\r\n");
  });

  it("blocks anonymous requests", async () => {
    requireTenant.mockImplementationOnce(() => {
      throw new hoisted.TenantRequiredError("Authentication required");
    });

    const response = await GET(new Request("https://test/api/v1/reports/export"));

    expect(response.status).toBe(401);
    expect(generateReportsExportCsv).not.toHaveBeenCalled();
  });

  it("blocks workers and unauthorized roles", async () => {
    isLiteWorkerClient.mockReturnValueOnce(true);
    const workerResponse = await GET(new Request("https://test/api/v1/reports/export"));
    expect(workerResponse.status).toBe(403);

    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      role: "member",
      userId: "worker-web-1",
      clientProfile: "web",
    });
    const memberResponse = await GET(new Request("https://test/api/v1/reports/export"));
    expect(memberResponse.status).toBe(403);

    isLiteWorkerClient.mockReturnValue(false);
    canReviewReport.mockReturnValue(false);
    const viewerResponse = await GET(new Request("https://test/api/v1/reports/export"));
    expect(viewerResponse.status).toBe(403);
    expect(generateReportsExportCsv).not.toHaveBeenCalled();
  });

  it("blocks stakeholder/customer-style roles", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      role: "stakeholder",
      userId: "stakeholder-1",
    });

    const response = await GET(new Request("https://test/api/v1/reports/export"));

    expect(response.status).toBe(403);
    expect(generateReportsExportCsv).not.toHaveBeenCalled();
  });

  it("rejects invalid query filters safely", async () => {
    const invalidStatus = await GET(new Request("https://test/api/v1/reports/export?status=manager_note"));
    expect(invalidStatus.status).toBe(400);

    const invalidDate = await GET(new Request("https://test/api/v1/reports/export?from=not-a-date"));
    expect(invalidDate.status).toBe(400);

    const invalidRange = await GET(new Request("https://test/api/v1/reports/export?range_days=forever"));
    expect(invalidRange.status).toBe(400);
    expect(generateReportsExportCsv).not.toHaveBeenCalled();
  });

  it("validates project scope before exporting project-filtered reports", async () => {
    getProject.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });

    const response = await GET(new Request("https://test/api/v1/reports/export?project_id=other-project"));

    expect(response.status).toBe(403);
    expect(generateReportsExportCsv).not.toHaveBeenCalled();
  });

  it("returns a private CSV attachment for manager/admin requests", async () => {
    const response = await GET(
      new Request("https://test/api/v1/reports/export?project_id=project-1&status=submitted&range_days=14")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="reports-export.csv"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(getProject).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tenantId: "tenant-1" }), "project-1");
    expect(generateReportsExportCsv).toHaveBeenCalledWith(
      expect.anything(),
      "tenant-1",
      expect.objectContaining({
        projectId: "project-1",
        status: "submitted",
        rangeDays: 14,
      })
    );
    await expect(response.text()).resolves.toContain("report-1");
  });

  it("allows tenant-wide export only for owner/admin roles", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      role: "owner",
      userId: "owner-1",
    });

    const response = await GET(new Request("https://test/api/v1/reports/export"));

    expect(response.status).toBe(200);
    expect(getProject).not.toHaveBeenCalled();
    expect(generateReportsExportCsv).toHaveBeenCalledWith(
      expect.anything(),
      "tenant-1",
      expect.objectContaining({ projectId: undefined })
    );
  });
});
