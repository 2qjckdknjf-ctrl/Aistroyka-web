import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const reviewAiAnalysis = vi.fn();
const emitAudit = vi.fn();
const canManageTasks = vi.fn();
const getTenantContextFromRequest = vi.fn();
const getAdminClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/tasks/task.policy", () => ({
  canManageTasks: (...args: unknown[]) => canManageTasks(...args),
}));

vi.mock("@/lib/domain/ai-analysis/review.service", () => ({
  reviewAiAnalysis: (...args: unknown[]) => reviewAiAnalysis(...args),
  validateReviewVerdict: (value: unknown) => {
    if (value === "accepted" || value === "rejected" || value === "insufficient_evidence") {
      return value;
    }
    return null;
  },
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

describe("POST /api/v1/ai/analysis/:id/review", () => {
  beforeEach(() => {
    reviewAiAnalysis.mockReset();
    emitAudit.mockReset().mockResolvedValue(undefined);
    canManageTasks.mockReset().mockReturnValue(true);
    getAdminClient.mockReset().mockReturnValue({ admin: true });
    getTenantContextFromRequest.mockReset().mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "admin",
    });
  });

  it("records accepted verdict and audits without customer/finance fields", async () => {
    reviewAiAnalysis.mockResolvedValue({
      ok: true,
      analysisId: "a1",
      reviewStatus: "accepted",
      graphEligible: true,
      reviewedAt: "2026-10-28T12:00:00.000Z",
      reviewedBy: "user-1",
    });

    const res = await POST(
      new Request("https://test/api/v1/ai/analysis/a1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "accepted",
          note: "looks good",
          margin: 42,
        }),
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );

    expect(res.status).toBe(200);
    expect(reviewAiAnalysis).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        analysisId: "a1",
        tenantId: "tenant-1",
        reviewerUserId: "user-1",
        status: "accepted",
        note: "looks good",
      })
    );
    expect(emitAudit).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        action: "ai_analysis_human_review",
        resource_type: "ai_analysis",
        resource_id: "a1",
        details: expect.not.objectContaining({ margin: 42 }),
      })
    );
    await expect(res.json()).resolves.toEqual({
      data: {
        analysis_id: "a1",
        review_status: "accepted",
        graph_eligible: true,
        reviewed_at: "2026-10-28T12:00:00.000Z",
        reviewed_by: "user-1",
      },
    });
  });

  it("denies non-managers including stakeholders", async () => {
    canManageTasks.mockReturnValue(false);
    const res = await POST(
      new Request("https://test/api/v1/ai/analysis/a1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(403);
    expect(reviewAiAnalysis).not.toHaveBeenCalled();
  });

  it("rejects invalid status", async () => {
    const res = await POST(
      new Request("https://test/api/v1/ai/analysis/a1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      }),
      { params: Promise.resolve({ id: "a1" }) }
    );
    expect(res.status).toBe(400);
    expect(reviewAiAnalysis).not.toHaveBeenCalled();
  });
});
