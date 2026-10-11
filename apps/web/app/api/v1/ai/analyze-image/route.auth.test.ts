import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { POST as legacyPost } from "@/app/api/ai/analyze-image/route";

const mocks = vi.hoisted(() => ({
  tenant: vi.fn(), project: vi.fn(), analyze: vi.fn(), quota: vi.fn(),
  media: vi.fn(), admin: vi.fn(),
}));
vi.mock("@/lib/tenant", async (original) => ({
  ...await original<typeof import("@/lib/tenant")>(), getTenantContextFromRequest: mocks.tenant,
}));
vi.mock("@/lib/domain/projects/project.service", () => ({ getProjectForInternalWorkspace: mocks.project }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: mocks.admin }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn(async () => {
  const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: mocks.media };
  return { from: vi.fn(() => chain) };
}) }));
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({ checkRateLimit: vi.fn(async () => ({ limited: false })) }));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai-usage/ai-usage.service")>(),
  checkQuota: mocks.quota, checkBudgetAlert: vi.fn(),
}));
vi.mock("@/lib/platform/ai/ai.service", async (original) => ({
  ...await original<typeof import("@/lib/platform/ai/ai.service")>(), analyzeImage: mocks.analyze,
}));
vi.mock("@/lib/observability/audit.service", () => ({ emitAiRuntimeAudit: vi.fn() }));

const valid = { tenantId: "tenant-a", userId: "user-a", role: "member", subscriptionTier: "pro" };
const absent = { tenantId: null, userId: null, role: null, subscriptionTier: null };
const image = { image_url: "https://example.com/photo.jpg" };
const result = { stage: "foundation", completion_percent: 20, risk_level: "low", detected_issues: [], recommendations: [] };
const request = (body = image) => new Request("https://test/api/v1/ai/analyze-image", { method: "POST", body: JSON.stringify(body) });

describe.each([["canonical", POST], ["legacy", legacyPost]] as const)("%s image authorization", (_label, handler) => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.unstubAllEnvs();
    vi.stubEnv("OPENAI_API_KEY", "test-placeholder");
    mocks.tenant.mockResolvedValue(valid); mocks.admin.mockReturnValue({});
    mocks.project.mockResolvedValue({ data: { id: "project-a" }, error: null });
    mocks.media.mockResolvedValue({ data: null, error: null });
    mocks.quota.mockResolvedValue(null); mocks.analyze.mockResolvedValue(result);
  });
  it("denies anonymous calls before body/config/provider work", async () => {
    mocks.tenant.mockResolvedValue(absent);
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await handler(new Request("https://test", { method: "POST", body: "invalid" }));
    expect(response.status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled(); expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("denies authenticated users without membership", async () => {
    mocks.tenant.mockResolvedValue({ ...absent, userId: "user-a" });
    expect((await handler(request())).status).toBe(401);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("returns 403 for service role tokens", async () => {
    const { TenantForbiddenError } = await import("@/lib/tenant");
    mocks.tenant.mockRejectedValue(new TenantForbiddenError());
    expect((await handler(request())).status).toBe(403);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it.each(["stakeholder", "viewer"])("denies unscoped analysis for %s", async (role) => {
    mocks.tenant.mockResolvedValue({ ...valid, role });
    expect((await handler(request())).status).toBe(403);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("keeps tenant quota on an unscoped authorized call", async () => {
    mocks.quota.mockResolvedValue("Budget exceeded");
    expect((await handler(request())).status).toBe(402);
    expect(mocks.quota).toHaveBeenCalledWith(expect.anything(), "tenant-a", expect.any(Number));
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("allows an authorized non-fallback analysis", async () => {
    const response = await handler(request());
    expect(response.status).toBe(200); expect(response.headers.get("X-AI-Fallback-Reason")).toBeNull();
    expect(mocks.analyze).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ tenantId: "tenant-a", userId: "user-a" }), expect.anything());
  });
  it("denies an inaccessible project before provider work", async () => {
    mocks.project.mockResolvedValue({ data: null, error: "Insufficient rights" });
    expect((await handler(request({ ...image, project_id: "project-b" } as typeof image))).status).toBe(403);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("denies another tenant's media even without project_id", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-b", tenant_id: "tenant-b", project_id: "project-b" }, error: null });
    expect((await handler(request({ ...image, media_id: "media-b" } as typeof image))).status).toBe(404);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("denies a supplied media/project mismatch", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-a", tenant_id: "tenant-a", project_id: "project-a" }, error: null });
    expect((await handler(request({ ...image, media_id: "media-a", project_id: "project-b" } as typeof image))).status).toBe(404);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("resolves and checks the media project when omitted by the caller", async () => {
    mocks.media.mockResolvedValue({ data: { id: "media-a", tenant_id: "tenant-a", project_id: "project-a" }, error: null });
    expect((await handler(request({ ...image, media_id: "media-a" } as typeof image))).status).toBe(200);
    expect(mocks.project).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(valid), "project-a");
    expect(mocks.analyze).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ projectId: "project-a", mediaId: "media-a" }));
  });
});
