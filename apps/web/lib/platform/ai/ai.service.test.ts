import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeImage, AIPolicyBlockedError, AIVisionFailedError } from "./ai.service";

vi.mock("@/lib/platform/ai-governance/policy.service", () => ({
  runPolicy: vi.fn().mockResolvedValue({ decision: "allow", rule_hits: [] }),
}));
vi.mock("@/lib/platform/ai/providers/provider.router", () => ({
  invokeVisionWithRouter: vi.fn(),
}));
vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  recordUsage: vi.fn().mockResolvedValue(undefined),
}));

const { runPolicy } = await import("@/lib/platform/ai-governance/policy.service");
const { invokeVisionWithRouter } = await import("@/lib/platform/ai/providers/provider.router");

describe("AIService.analyzeImage", () => {
  const admin = {} as any;

  beforeEach(() => {
    vi.mocked(runPolicy).mockReset().mockResolvedValue({ decision: "allow", rule_hits: [] });
    vi.mocked(invokeVisionWithRouter).mockReset();
  });

  it("calls runPolicy when tenantId is present", async () => {
    (invokeVisionWithRouter as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify({
        stage: "foundation",
        completion_percent: 50,
        risk_level: "medium",
        detected_issues: [],
        recommendations: [],
      }),
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      providerUsed: "openai",
      modelUsed: "gpt-4o",
    });
    await analyzeImage(
      admin,
      { tenantId: "t1", userId: "u1", subscriptionTier: "free", traceId: "trace-1" },
      { imageUrl: "https://example.com/photo.jpg" }
    );
    expect(runPolicy).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        tenant_id: "t1",
        subscription_tier: "free",
        resource_type: "media",
        image_count: 1,
      }),
      "trace-1"
    );
    expect(invokeVisionWithRouter).toHaveBeenCalledWith(
      admin,
      "https://example.com/photo.jpg",
      expect.objectContaining({ tier: "free", maxTokens: 1024 })
    );
  });

  it("throws AIPolicyBlockedError when policy decision is block", async () => {
    vi.mocked(runPolicy).mockResolvedValueOnce({
      decision: "block",
      rule_hits: ["quota_exceeded"],
    });
    await expect(
      analyzeImage(
        admin,
        { tenantId: "t1", userId: "u1", traceId: null },
        { imageUrl: "https://example.com/photo.jpg" }
      )
    ).rejects.toThrow(AIPolicyBlockedError);
    expect(invokeVisionWithRouter).not.toHaveBeenCalled();
  });

  it("throws AIVisionFailedError when router returns null", async () => {
    (runPolicy as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      decision: "allow",
      rule_hits: [],
    });
    (invokeVisionWithRouter as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(
      analyzeImage(
        admin,
        { tenantId: "t1", userId: null, traceId: null },
        { imageUrl: "https://example.com/photo.jpg" }
      )
    ).rejects.toThrow(AIVisionFailedError);
  });

  it("returns AnalysisResult shape when router returns valid JSON", async () => {
    (runPolicy as ReturnType<typeof vi.fn>).mockResolvedValue({
      decision: "allow",
      rule_hits: [],
    });
    (invokeVisionWithRouter as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: JSON.stringify({
        stage: "framing",
        completion_percent: 60,
        risk_level: "low",
        detected_issues: ["Minor weather exposure"],
        recommendations: ["Schedule roofing soon"],
      }),
      usage: { prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 },
      providerUsed: "openai",
      modelUsed: "gpt-4o",
    });
    const result = await analyzeImage(
      admin,
      { tenantId: "t1", userId: "u1", traceId: "t1" },
      { imageUrl: "https://example.com/photo.jpg" }
    );
    expect(result).toMatchObject({
      stage: "framing",
      completion_percent: 60,
      risk_level: "low",
      detected_issues: ["Minor weather exposure"],
      recommendations: ["Schedule roofing soon"],
    });
  });

  it("skips runPolicy when tenantId is null", async () => {
    vi.mocked(runPolicy).mockClear();
    vi.mocked(invokeVisionWithRouter).mockResolvedValue({
      content: JSON.stringify({
        stage: "unknown",
        completion_percent: 0,
        risk_level: "medium",
        detected_issues: [],
        recommendations: [],
      }),
      usage: { prompt_tokens: 100, completion_tokens: 30, total_tokens: 130 },
      providerUsed: "openai",
      modelUsed: "gpt-4o",
    });
    await analyzeImage(
      admin,
      { tenantId: null, userId: null, traceId: null },
      { imageUrl: "https://example.com/photo.jpg" }
    );
    expect(runPolicy).not.toHaveBeenCalled();
    expect(invokeVisionWithRouter).toHaveBeenCalled();
  });
});
