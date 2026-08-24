import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

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
const getProjectMembership = vi.fn().mockResolvedValue({ role: "manager", source: "project_members" });
const getById = vi.fn();
const getProjectIdForReport = vi.fn().mockResolvedValue("project-1");
const updateReview = vi.fn();
const listMediaByReportIdWithUrls = vi.fn().mockResolvedValue([]);
const emitAudit = vi.fn().mockResolvedValue(undefined);
const applyOwnerVisibilityOnReportReview = vi.fn().mockResolvedValue({
  updated_count: 0,
  report_id: "r1",
  review_status: "approved",
  idempotent: true,
});

vi.mock("@/lib/domain/visual-evidence/owner-evidence-visibility.service", () => ({
  applyOwnerVisibilityOnReportReview: (...args: unknown[]) =>
    applyOwnerVisibilityOnReportReview(...args),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
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

vi.mock("@/lib/domain/projects/project-access", () => ({
  getProjectMembership: (...args: unknown[]) => getProjectMembership(...args),
}));

vi.mock("@/lib/domain/reports/report.repository", () => ({
  getById: (...args: unknown[]) => getById(...args),
  getProjectIdForReport: (...args: unknown[]) => getProjectIdForReport(...args),
  updateReview: (...args: unknown[]) => updateReview(...args),
  listMediaByReportIdWithUrls: (...args: unknown[]) => listMediaByReportIdWithUrls(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

describe("PATCH /api/v1/reports/:id", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    isLiteWorkerClient.mockReset();
    isLiteWorkerClient.mockReturnValue(false);
    getProjectMembership.mockReset();
    getProjectMembership.mockResolvedValue({ role: "manager", source: "project_members" });
    getById.mockReset();
    getById.mockResolvedValue({
      id: "r1",
      tenant_id: "tenant-1",
      user_id: "worker-1",
      status: "submitted",
      task_id: "task-1",
      day_id: null,
    });
    getProjectIdForReport.mockReset();
    getProjectIdForReport.mockResolvedValue("project-1");
    canReviewReport.mockReturnValue(true);
    updateReview.mockReset();
    listMediaByReportIdWithUrls.mockResolvedValue([]);
    emitAudit.mockReset();
    emitAudit.mockResolvedValue(undefined);
  });

  it("returns 403 for unauthorized reviewer", async () => {
    canReviewReport.mockReturnValueOnce(false);
    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(403);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 403 for lite worker clients even if role policy would otherwise pass", async () => {
    isLiteWorkerClient.mockReturnValueOnce(true);

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(403);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 403 for tenant member without explicit project manager role even on web client", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      userId: "member-1",
      role: "member",
      clientProfile: "web",
    });
    canReviewReport.mockReturnValueOnce(true);
    getProjectMembership.mockResolvedValueOnce(null);

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-client": "web" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(403);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 403 for project worker even without lite-client marker", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      userId: "worker-1",
      role: "member",
      clientProfile: "web",
    });
    canReviewReport.mockReturnValueOnce(true);
    getProjectMembership.mockResolvedValueOnce({ role: "internal_member", source: "project_members" });

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-client": "ios_manager" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(403);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid review status", async () => {
    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(400);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 400 when reject/request_changes has no manager note", async () => {
    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "changes_requested" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("manager_note_required");
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns 404 when report is not in submitted state (wrong tenant/project path)", async () => {
    getById.mockResolvedValueOnce(null);
    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(404);
    expect(updateReview).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("allows explicit project manager to review a report", async () => {
    getTenantContextFromRequest.mockResolvedValueOnce({
      ...tenantContext,
      userId: "project-manager-1",
      role: "member",
      clientProfile: "web",
    });
    canReviewReport.mockReturnValueOnce(true);
    getProjectMembership.mockResolvedValueOnce({ role: "manager", source: "project_members" });
    updateReview.mockResolvedValue({
      id: "r1",
      status: "approved",
      reviewed_by: "project-manager-1",
      reviewed_at: "2026-05-20T00:00:00.000Z",
      manager_note: null,
    });

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateReview).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
      "tenant-1",
      "project-manager-1",
      { status: "approved", manager_note: null }
    );
    expect(emitAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      tenant_id: "tenant-1",
      user_id: "project-manager-1",
      action: "report_review",
      resource_id: "r1",
    }));
  });

  it.each([
    ["approved", undefined, null],
    ["rejected", "needs correction", "needs correction"],
    ["changes_requested", "add more photos", "add more photos"],
  ] as const)("returns updated report payload and audit for %s transition", async (status, inputNote, expectedNote) => {
    updateReview.mockResolvedValue({
      id: "r1",
      status,
      reviewed_by: "manager-1",
      reviewed_at: "2026-05-20T00:00:00.000Z",
      manager_note: expectedNote,
    });
    listMediaByReportIdWithUrls.mockResolvedValue([{ media_id: "m1", upload_session_id: null, file_url: null }]);

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, ...(inputNote === undefined ? {} : { manager_note: inputNote }) }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateReview).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
      "tenant-1",
      "manager-1",
      { status, manager_note: expectedNote }
    );
    expect(emitAudit).toHaveBeenCalledWith(expect.anything(), {
      tenant_id: "tenant-1",
      user_id: "manager-1",
      trace_id: "trace-1",
      action: "report_review",
      resource_type: "report",
      resource_id: "r1",
      details: { status, has_note: Boolean(expectedNote) },
    });
    const body = await response.json();
    expect(body.data.status).toBe(status);
    expect(body.data.reviewed_by).toBe("manager-1");
    expect(body.data.media).toHaveLength(1);
  });
});

