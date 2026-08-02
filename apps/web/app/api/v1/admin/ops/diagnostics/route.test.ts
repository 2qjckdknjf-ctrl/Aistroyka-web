import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({ tenantId: "t1", userId: "u1", role: "admin" }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  LitePathForbiddenError: class LitePathForbiddenError extends Error {},
}));
vi.mock("@/lib/api/require-admin", () => ({
  requireAdmin: vi.fn().mockReturnValue(null),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));
vi.mock("@/lib/config/public", () => ({
  getBuildStamp: vi.fn().mockReturnValue({ sha: "deadbeef123", buildTime: "2026-03-15T12:00:00Z" }),
}));
vi.mock("@/lib/ops/ops-metrics.repository", () => ({
  getOpsMetrics: vi.fn().mockResolvedValue({
    uploads_stuck: 1,
    jobs_failed: 2,
    ai_failed: 1,
    sync_conflicts: 0,
    push_failed: 0,
    uploads_expired: 0,
    devices_offline: 0,
    tasks_assigned_today: 0,
    tasks_completed_today: 0,
    tasks_open_today: 0,
    tasks_overdue: 0,
  }),
}));
vi.mock("@/lib/observability/audit.service", () => ({
  listAiRuntimeAuditRows: vi.fn().mockResolvedValue([
    { action: "ai_vision_analyze_error", details: { route: "POST /api/ai/analyze-image", error_kind: "provider_timeout" }, created_at: "2026-03-15T10:00:00Z", trace_id: "tr1" },
    { action: "ai_intelligence_complete", details: { route: "GET /api/v1/projects/1/intelligence" }, created_at: "2026-03-15T10:01:00Z" },
  ]),
  aggregateAiRuntimeRows: vi.fn().mockReturnValue({
    by_action: { ai_vision_analyze_error: 1, ai_intelligence_complete: 1 },
    errors_by_kind: { provider_timeout: 1 },
    recent_error_sample: [{ trace_id: "tr1", action: "ai_vision_analyze_error", error_kind: "provider_timeout", at: "2026-03-15T10:00:00Z" }],
  }),
}));
vi.mock("@/lib/observability/metrics.service", () => ({
  getFailedJobs: vi.fn().mockResolvedValue([
    { id: "j1", type: "ai_analyze_media", status: "failed", last_error: "Timeout", created_at: "2026-03-15T09:00:00Z" },
    { id: "j2", type: "ai_analyze_media", status: "dead", last_error: "Policy blocked", created_at: "2026-03-15T08:00:00Z" },
    { id: "j3", type: "upload_reconcile", status: "failed", last_error: "Storage error", created_at: "2026-03-15T07:00:00Z" },
  ]),
}));

describe("GET /api/v1/admin/ops/diagnostics", () => {
  it("returns 200 with correlation, ops_metrics, ai_runtime, job_failures, operator_hints", async () => {
    const req = new Request("https://x/api/v1/admin/ops/diagnostics?hours=24");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // route truncates stamp.sha to 7 chars (see diagnostics route)
    expect(body.correlation).toMatchObject({
      build_sha: "deadbee",
      build_time: "2026-03-15T12:00:00Z",
    });
    expect(body.ops_metrics).toBeDefined();
    expect(body.ops_metrics.jobs_failed).toBe(2);
    expect(body.ai_runtime).toBeDefined();
    expect(body.ai_runtime.window_hours).toBe(24);
    expect(body.ai_runtime.error_count).toBe(1);
    expect(body.ai_runtime.complete_count).toBe(1);
    expect(body.ai_runtime.errors_by_provider).toBeDefined();
    expect(body.job_failures).toBeDefined();
    expect(body.job_failures.by_type).toEqual({ ai_analyze_media: 2, upload_reconcile: 1 });
    expect(body.job_failures.total).toBe(3);
    expect(body.job_failures.recent.length).toBeGreaterThan(0);
    expect(body.operator_hints).toBeDefined();
    expect(body.operator_hints.correlate).toBeDefined();
    expect(body.operator_hints.runbooks).toBeDefined();
    expect(Array.isArray(body.incident_hints) || body.incident_hints === null).toBe(true);
  });

  it("returns 401 when requireTenant throws", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError("Authentication required");
    });
    const req = new Request("https://x/api/v1/admin/ops/diagnostics");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when requireAdmin returns error", async () => {
    const { requireAdmin } = await import("@/lib/api/require-admin");
    vi.mocked(requireAdmin).mockReturnValueOnce(new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }));
    const req = new Request("https://x/api/v1/admin/ops/diagnostics");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
