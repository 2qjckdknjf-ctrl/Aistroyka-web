import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { POST as canonicalPost } from "@/app/api/v1/analysis/process/route";
const mocks = vi.hoisted(() => ({ tenant: vi.fn(), process: vi.fn(), client: {} }));
vi.mock("@/lib/tenant", async (original) => ({ ...await original<typeof import("@/lib/tenant")>(), getTenantContextFromRequest: mocks.tenant }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn(async () => mocks.client) }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/ai/runOneJob", () => ({ processOneJob: mocks.process }));
const valid = { tenantId: "tenant-a", userId: "user-a", role: "member", subscriptionTier: "pro" };
describe.each([["legacy", POST], ["canonical", canonicalPost]] as const)("%s worker authorization", (_name, handler) => {
  beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); mocks.tenant.mockResolvedValue(valid); mocks.process.mockResolvedValue({ ok: false, reason: "no_job" }); });
  it.each([null, "user-without-tenant"])("denies missing membership (%s)", async (userId) => {
    mocks.tenant.mockResolvedValue({ tenantId: null, userId, role: null });
    expect((await handler(new Request("https://safe.test/api/analysis/process", { method: "POST" }))).status).toBe(401);
    expect(mocks.process).not.toHaveBeenCalled();
  });
  it.each(["viewer", "stakeholder"])("denies %s processing", async (role) => {
    mocks.tenant.mockResolvedValue({ ...valid, role });
    expect((await handler(new Request("https://safe.test/api/analysis/process", { method: "POST" }))).status).toBe(403);
    expect(mocks.process).not.toHaveBeenCalled();
  });
  it("denies service tokens", async () => {
    const { TenantForbiddenError } = await import("@/lib/tenant");
    mocks.tenant.mockRejectedValue(new TenantForbiddenError());
    expect((await handler(new Request("https://safe.test/api/analysis/process", { method: "POST" }))).status).toBe(403);
  });
  it.each(["/api/ai/analyze-image", "/api/v1/ai/analyze-image"])("forwards auth to the same-origin %s callback", async (path) => {
    vi.stubEnv("AI_ANALYSIS_URL", "https://safe.test" + path);
    await handler(new Request("https://safe.test/api/analysis/process", { method: "POST", headers: { Authorization: "Bearer test-only", Cookie: "session=test-only" } }));
    const options = mocks.process.mock.calls[0][2];
    expect(options.tenantId).toBe("tenant-a"); expect(options.userId).toBe("user-a");
    expect(options.subscriptionTier).toBe("pro"); expect(options.callerClient).toBe(mocks.client);
    expect(options.aiRequestHeaders.get("authorization")).toBe("Bearer test-only");
    expect(options.aiRequestHeaders.get("cookie")).toBe("session=test-only");
  });
  it.each([
    ["https://www.aistroyka.ai", "https://aistroyka.ai"],
    ["https://aistroyka.ai", "https://www.aistroyka.ai"],
  ])("forwards auth between official production hosts (%s → %s)", async (source, target) => {
    vi.stubEnv("AI_ANALYSIS_URL", target + "/api/ai/analyze-image");
    await handler(new Request(source + "/api/analysis/process", { method: "POST", headers: { Authorization: "Bearer test-only" } }));
    expect(mocks.process.mock.calls[0][2].aiRequestHeaders.get("authorization")).toBe("Bearer test-only");
  });
  it.each(["https://www.aistroyka.ai.evil.test", "https://staging.aistroyka.ai", "http://www.aistroyka.ai", "https://www.aistroyka.ai:444"])("rejects production credential forwarding to %s", async (target) => {
    vi.stubEnv("AI_ANALYSIS_URL", target + "/api/ai/analyze-image");
    await handler(new Request("https://aistroyka.ai/api/analysis/process", { method: "POST", headers: { Authorization: "Bearer test-only" } }));
    expect([...mocks.process.mock.calls[0][2].aiRequestHeaders]).toEqual([]);
  });
  it.each(["https://external.test/api/ai/analyze-image", "https://safe.test/unrelated"])("does not forward credentials to %s", async (url) => {
    vi.stubEnv("AI_ANALYSIS_URL", url);
    await handler(new Request("https://safe.test/api/analysis/process", { method: "POST", headers: { Authorization: "Bearer test-only", Cookie: "session=test-only" } }));
    expect([...mocks.process.mock.calls[0][2].aiRequestHeaders]).toEqual([]);
  });
});
