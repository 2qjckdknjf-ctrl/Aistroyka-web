import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ audit: vi.fn(), analyze: vi.fn() }));
vi.mock("@/lib/tenant", async original => ({
  ...await original<typeof import("@/lib/tenant")>(),
  getTenantContextFromRequest: vi.fn(async () => ({ tenantId:"tenant-a",userId:"user-a",role:"owner",subscriptionTier:"free" })),
}));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn(async () => ({})) }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn(() => ({})) }));
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({ checkRateLimit: vi.fn(async () => ({ limited:false })) }));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  checkQuota:vi.fn(async () => null),checkBudgetAlert:vi.fn(async () => {}),estimateMaxVisionCostUsd:vi.fn(() => 0),
}));
vi.mock("@/lib/platform/ai/ai.service", async original => ({ ...await original<typeof import("@/lib/platform/ai/ai.service")>(),analyzeImage:mocks.analyze }));
vi.mock("@/lib/observability/audit.service", () => ({ emitAiRuntimeAudit:mocks.audit }));
import { POST } from "./route";
const result={stage:"foundation",completion_percent:20,risk_level:"low",detected_issues:[],recommendations:[]};
const request=()=>new Request("https://app.test/api/v1/ai/analyze-image", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_url:"https://image.test/photo.png"})});
beforeEach(() => { vi.resetAllMocks();vi.stubEnv("OPENAI_API_KEY","test-only");mocks.analyze.mockResolvedValue(result);mocks.audit.mockResolvedValue(undefined); });
afterEach(() => { vi.unstubAllEnvs(); });
it("keeps the request alive until its metadata audit finishes",async () => {
  let finish!:()=>void;let returned=false;
  mocks.audit.mockImplementationOnce(() => new Promise<void>(resolve => {finish=resolve;}));
  const response=POST(request()).then(r => {returned=true;return r;});
  await vi.waitFor(() => expect(mocks.audit).toHaveBeenCalledTimes(1));
  expect(returned).toBe(false);finish();
  const r=await response;expect(r.status).toBe(200);expect(await r.json()).toEqual(result);
  const audit=mocks.audit.mock.calls[0][1];expect(audit.action).toBe("ai_vision_analyze_complete");
  expect(JSON.stringify(audit.details)).not.toContain("image.test");
});
it("preserves successful provider output when audit storage rejects",async () => {
  mocks.audit.mockRejectedValueOnce(new Error("Audit outage"));
  const r=await POST(request());expect(r.status).toBe(200);expect(await r.json()).toEqual(result);
});
