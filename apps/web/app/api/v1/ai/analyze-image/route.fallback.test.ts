import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/tenant", () => ({ getTenantContextFromRequest: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClientFromRequest: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));
vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai-usage/ai-usage.service")>(
    "@/lib/platform/ai-usage/ai-usage.service"
  );
  return {
    ...mod,
    checkQuota: vi.fn().mockResolvedValue(null),
    checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock("@/lib/platform/ai/ai.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/platform/ai/ai.service")>(
    "@/lib/platform/ai/ai.service"
  );
  return {
    ...mod,
    analyzeImage: vi.fn(),
  };
});
vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

function jsonRequest(body: object) {
  return new Request("http://test/api/v1/ai/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/ai/analyze-image — vision deterministic fallback", () => {
  beforeEach(async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("AI_VISION_DETERMINISTIC_FALLBACK", "true");
    const tenant = await import("@/lib/tenant");
    vi.mocked(tenant.getTenantContextFromRequest).mockResolvedValue({
      tenantId: null,
      userId: null,
      subscriptionTier: "free",
    } as never);
    const server = await import("@/lib/supabase/server");
    vi.mocked(server.createClientFromRequest).mockResolvedValue({} as never);
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(ai.analyzeImage).mockReset();
  });

  it("returns 200 with fallback body and X-AI-Fallback-Reason when analyzeImage throws AIVisionFailedError", async () => {
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(ai.analyzeImage).mockRejectedValue(new ai.AIVisionFailedError("All AI providers failed"));

    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Fallback-Reason")).toBe("provider_unavailable");
    const body = (await res.json()) as {
      stage: string;
      completion_percent: number;
      risk_level: string;
      detected_issues: string[];
    };
    expect(body.risk_level).toBe("medium");
    expect(body.completion_percent).toBe(0);
    expect(body.detected_issues[0]).toContain("temporarily unavailable");
  });

  it("uses provider_timeout fallback reason when error message indicates timeout", async () => {
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(ai.analyzeImage).mockRejectedValue(new ai.AIVisionFailedError("Upstream timeout"));

    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Fallback-Reason")).toBe("provider_timeout");
    const body = (await res.json()) as { detected_issues: string[] };
    expect(body.detected_issues[0]).toContain("timeout");
  });

  it("returns 502 when AI_VISION_DETERMINISTIC_FALLBACK is disabled", async () => {
    vi.stubEnv("AI_VISION_DETERMINISTIC_FALLBACK", "false");
    const ai = await import("@/lib/platform/ai/ai.service");
    vi.mocked(ai.analyzeImage).mockRejectedValue(new ai.AIVisionFailedError("All AI providers failed"));

    const res = await POST(jsonRequest({ image_url: "https://example.com/photo.jpg" }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeDefined();
  });
});
