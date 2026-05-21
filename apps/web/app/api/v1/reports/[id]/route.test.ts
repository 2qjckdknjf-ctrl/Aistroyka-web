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
const updateReview = vi.fn();
const listMediaByReportIdWithUrls = vi.fn().mockResolvedValue([]);
const emitAudit = vi.fn().mockResolvedValue(undefined);

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

vi.mock("@/lib/domain/reports/report.repository", () => ({
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
    canReviewReport.mockReturnValue(true);
    updateReview.mockReset();
    listMediaByReportIdWithUrls.mockResolvedValue([]);
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
  });

  it("returns 404 when report is not in submitted state (wrong tenant/project path)", async () => {
    updateReview.mockResolvedValueOnce(null);
    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(404);
  });

  it("returns updated report payload for approve/reject/request_changes transitions", async () => {
    updateReview.mockResolvedValue({
      id: "r1",
      status: "approved",
      reviewed_by: "manager-1",
      reviewed_at: "2026-05-20T00:00:00.000Z",
      manager_note: "ok",
    });
    listMediaByReportIdWithUrls.mockResolvedValue([{ media_id: "m1", upload_session_id: null, file_url: null }]);

    const response = await PATCH(
      new Request("https://test/api/v1/reports/r1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved", manager_note: "ok" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateReview).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
      "tenant-1",
      "manager-1",
      { status: "approved", manager_note: "ok" }
    );
    expect(emitAudit).toHaveBeenCalled();
    const body = await response.json();
    expect(body.data.status).toBe("approved");
    expect(body.data.reviewed_by).toBe("manager-1");
    expect(body.data.media).toHaveLength(1);
  });
});

