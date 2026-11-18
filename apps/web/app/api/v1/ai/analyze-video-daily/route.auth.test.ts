import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { POST as legacyPost } from "@/app/api/ai/analyze-video-daily/route";
const mocks = vi.hoisted(() => ({ tenant: vi.fn(), project: vi.fn(), media: vi.fn(), analyze: vi.fn(), quota: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/tenant", async (original) => ({ ...await original<typeof import("@/lib/tenant")>(), getTenantContextFromRequest: mocks.tenant }));
vi.mock("@/lib/domain/projects/project.service", () => ({ getProjectForInternalWorkspace: mocks.project }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: mocks.admin }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn(async () => {
  const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: mocks.media };
  return { from: vi.fn(() => chain) };
}) }));
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({ checkRateLimit: vi.fn(async () => ({ limited: false })) }));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai-usage/ai-usage.service")>(), checkQuota: mocks.quota, checkBudgetAlert: vi.fn(),
}));
vi.mock("@/lib/platform/ai/ai.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai/ai.service")>(), analyzeVideoDailyWork: mocks.analyze,
}));
vi.mock("@/lib/observability/audit.service", () => ({ emitAiRuntimeAudit: vi.fn() }));
const valid = { tenantId: "tenant-a", userId: "user-a", role: "member", subscriptionTier: "pro" };
const video = { video_url: "https://example.com/work.mp4" };
const result = { work_date: "2026-10-11", summary: "Concrete pour", activities_observed: [], completion_estimate_percent: 20, risk_level: "low", issues_and_risks: [], recommendations: [] };
const request = (extra: object = {}) => new Request("https://test/api/v1/ai/analyze-video-daily", { method: "POST", body: JSON.stringify({ ...video, ...extra }) });
describe.each([["canonical", POST], ["legacy", legacyPost]] as const)("%s video authorization", (_name, handler) => {
  beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.stubEnv("GEMINI_API_KEY", "test-placeholder");
    mocks.tenant.mockResolvedValue(valid); mocks.project.mockResolvedValue({ data: { id: "project-a" }, error: null });
    mocks.media.mockResolvedValue({ data: null, error: null }); mocks.quota.mockResolvedValue(null);
    mocks.analyze.mockResolvedValue(result); mocks.admin.mockReturnValue({});
  });
  it("denies anonymous calls before provider work", async () => {
    mocks.tenant.mockResolvedValue({ tenantId: null, userId: null, role: null });
    expect((await handler(request())).status).toBe(401); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it.each(["viewer", "stakeholder"])("denies unscoped %s calls before provider config", async (role) => {
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GOOGLE_AI_API_KEY", "");
    mocks.tenant.mockResolvedValue({ ...valid, role });
    expect((await handler(request())).status).toBe(403); expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("returns 403 instead of throwing on a service token", async () => {
    const { TenantForbiddenError } = await import("@/lib/tenant");
    mocks.tenant.mockRejectedValue(new TenantForbiddenError());
    expect((await handler(request())).status).toBe(403); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("retains authorized member video analysis", async () => {
    const response = await handler(request()); expect(response.status).toBe(200);
    expect(mocks.analyze).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tenantId: "tenant-a", userId: "user-a" }), expect.anything());
  });
  it("retains tenant quota for an unscoped authorized call", async () => {
    mocks.quota.mockResolvedValue("Budget exceeded"); expect((await handler(request())).status).toBe(402);
    expect(mocks.quota).toHaveBeenCalledWith(expect.anything(), "tenant-a", expect.any(Number)); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("denies foreign media without project_id", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-b", tenant_id: "tenant-b", project_id: "project-b" }, error: null });
    expect((await handler(request({ media_id: "media-b" }))).status).toBe(404); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("denies a mismatched project and media reference", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-a", tenant_id: "tenant-a", project_id: "project-a" }, error: null });
    expect((await handler(request({ media_id: "media-a", project_id: "project-b" }))).status).toBe(404); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("authorizes the derived media project before provider execution", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-a", tenant_id: "tenant-a", project_id: "project-a" }, error: null });
    mocks.project.mockResolvedValue({ data: null, error: "Insufficient rights" });
    expect((await handler(request({ media_id: "media-a" }))).status).toBe(403); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("handles equivalent UUID project casing", async () => {
    const project = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    mocks.media.mockResolvedValue({ data: { id: "media-a", tenant_id: "tenant-a", project_id: project }, error: null });
    expect((await handler(request({ media_id: "media-a", project_id: project.toUpperCase() }))).status).toBe(200);
    expect(mocks.project).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(valid), project);
  });
});
