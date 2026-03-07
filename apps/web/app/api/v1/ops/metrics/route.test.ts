import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({ tenantId: "t1", userId: "u1" }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/ops/ops-metrics.repository", () => ({
  getOpsMetrics: vi.fn().mockResolvedValue({
    uploads_stuck: 0,
    uploads_expired: 0,
    devices_offline: 0,
    sync_conflicts: 0,
    ai_failed: 0,
    jobs_failed: 0,
    push_failed: 0,
    tasks_assigned_today: 0,
    tasks_completed_today: 0,
    tasks_open_today: 0,
    tasks_overdue: 0,
  }),
}));

describe("GET /api/v1/ops/metrics", () => {
  it("returns 200 with valid bearer and tenant membership", async () => {
    const req = new Request("https://x/api/v1/ops/metrics");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      uploads_stuck: 0,
      uploads_expired: 0,
      devices_offline: 0,
      sync_conflicts: 0,
      ai_failed: 0,
      jobs_failed: 0,
      push_failed: 0,
      tasks_assigned_today: 0,
      tasks_completed_today: 0,
      tasks_open_today: 0,
      tasks_overdue: 0,
    });
    const { getOpsMetrics } = await import("@/lib/ops/ops-metrics.repository");
    expect(getOpsMetrics).toHaveBeenCalledWith(expect.anything(), "t1", expect.any(Object));
  });

  it("passes from, to, project_id to repository", async () => {
    const req = new Request("https://x/api/v1/ops/metrics?from=2026-03-01&to=2026-03-06&project_id=p1");
    await GET(req);
    const { getOpsMetrics } = await import("@/lib/ops/ops-metrics.repository");
    expect(getOpsMetrics).toHaveBeenCalledWith(expect.anything(), "t1", {
      from: "2026-03-01",
      to: "2026-03-06",
      project_id: "p1",
    });
  });

  it("returns 401 when no auth (requireTenant throws TenantRequiredError)", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t",
    });
    vi.mocked(requireTenant).mockImplementation(() => {
      throw new TenantRequiredError("Authentication required");
    });
    const req = new Request("https://x/api/v1/ops/metrics");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Authentication required");
  });

  it("returns 403 when valid bearer but no tenant membership", async () => {
    const { getTenantContextFromRequest } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: null,
      userId: "u1",
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t",
    });
    const req = new Request("https://x/api/v1/ops/metrics");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("User has no tenant membership");
  });

  it("returns 403 when service_role JWT (getTenantContextFromRequest throws TenantForbiddenError)", async () => {
    const { getTenantContextFromRequest, TenantForbiddenError } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockRejectedValueOnce(new TenantForbiddenError());
    const req = new Request("https://x/api/v1/ops/metrics");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
