import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import * as approvals from "@/lib/domain/approvals/pending-approvals.service";
import * as tenant from "@/lib/tenant";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/reports/report.policy", () => ({
  canReviewReport: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/domain/approvals/pending-approvals.service", () => ({
  listPendingApprovals: vi.fn(),
}));

describe("GET /api/v1/approvals/pending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(approvals.listPendingApprovals).mockResolvedValue([]);
  });

  it("returns 503 when pending approvals lookup fails", async () => {
    vi.mocked(approvals.listPendingApprovals).mockRejectedValue(new Error("day lookup failed"));
    const res = await GET(new Request("https://test/api/v1/approvals/pending"));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ error: "Failed to load pending approvals" });
  });

  it("returns 200 data when lookups succeed", async () => {
    vi.mocked(approvals.listPendingApprovals).mockResolvedValue([
      {
        kind: "report",
        id: "r1",
        status: "submitted",
        project_id: "p1",
        pending_at: "2026-04-17T08:00:00.000Z",
        worker_id: "w1",
      },
    ]);
    const res = await GET(new Request("https://test/api/v1/approvals/pending"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ data: [{ id: "r1" }] });
  });
});
