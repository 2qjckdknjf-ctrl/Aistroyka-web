import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInvokeVision = vi.hoisted(() => vi.fn());
const mockAnthropicInvoke = vi.hoisted(() => vi.fn());
const mockGeminiInvoke = vi.hoisted(() => vi.fn());

vi.mock("@/lib/platform/ai/routing/tenant-ai-preferences", () => ({
  getTenantAIPreferences: vi.fn(),
}));
vi.mock("./circuit-breaker", () => ({
  canInvoke: vi.fn(),
  recordSuccess: vi.fn(),
  recordFailure: vi.fn(),
}));
vi.mock("./provider.openai", () => ({
  openaiProvider: { name: "openai", invokeVision: mockInvokeVision },
}));
vi.mock("./provider.anthropic", () => ({
  anthropicProvider: { name: "anthropic", invokeVision: mockAnthropicInvoke },
}));
vi.mock("./provider.gemini", () => ({
  geminiProvider: { name: "gemini", invokeVision: mockGeminiInvoke },
}));

import { getTenantAIPreferences } from "@/lib/platform/ai/routing/tenant-ai-preferences";
import { canInvoke, recordSuccess, recordFailure } from "./circuit-breaker";
import { invokeVisionWithRouter } from "./provider.router";

const supabase = {} as any;

function makeResult(provider: string, model: string) {
  return {
    content: '{"stage":"foundation","completion_percent":50,"risk_level":"medium","detected_issues":[],"recommendations":[]}',
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    providerUsed: provider,
    modelUsed: model,
  };
}

describe("provider.router", () => {
  beforeEach(() => {
    vi.mocked(getTenantAIPreferences).mockResolvedValue({ fallbackEnabled: true });
    vi.mocked(canInvoke).mockResolvedValue(true);
    vi.mocked(recordSuccess).mockResolvedValue(undefined);
    vi.mocked(recordFailure).mockResolvedValue(undefined);
    mockInvokeVision.mockReset();
    mockAnthropicInvoke.mockReset();
    mockGeminiInvoke.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses default order (openai, anthropic, gemini) when no tenant preference", async () => {
    mockInvokeVision.mockResolvedValue(null);
    mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      tier: "free",
      maxTokens: 1024,
    });

    expect(result).not.toBeNull();
    expect(result?.providerUsed).toBe("anthropic");
    expect(mockInvokeVision).toHaveBeenCalled();
    expect(mockAnthropicInvoke).toHaveBeenCalled();
    expect(recordSuccess).toHaveBeenCalledWith(supabase, "anthropic");
  });

  it("prefers tenant provider when set and uses fallback on failure", async () => {
    vi.mocked(getTenantAIPreferences).mockResolvedValue({
      providerPreference: "gemini",
      fallbackEnabled: true,
      modelTier: "standard",
    });
    mockGeminiInvoke.mockResolvedValue(null);
    mockInvokeVision.mockResolvedValue(makeResult("openai", "gpt-4o"));

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      tenantId: "tenant-1",
      maxTokens: 1024,
    });

    expect(result).not.toBeNull();
    expect(result?.providerUsed).toBe("openai");
    expect(mockGeminiInvoke).toHaveBeenCalled();
    expect(mockInvokeVision).toHaveBeenCalled();
  });

  it("skips provider when circuit breaker says canInvoke false", async () => {
    vi.mocked(canInvoke).mockImplementation(async (_s, provider) => provider !== "openai");
    mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      maxTokens: 1024,
    });

    expect(result?.providerUsed).toBe("anthropic");
    expect(mockInvokeVision).not.toHaveBeenCalled();
  });

  it("returns null when all providers fail with retryable errors", async () => {
    mockInvokeVision.mockRejectedValue(new Error("timeout"));
    mockAnthropicInvoke.mockRejectedValue(new Error("rate limit"));
    mockGeminiInvoke.mockResolvedValue(null);

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      maxTokens: 1024,
    });

    expect(result).toBeNull();
    expect(recordFailure).toHaveBeenCalledWith(supabase, "openai");
    expect(recordFailure).toHaveBeenCalledWith(supabase, "anthropic");
  });

  it("passes model from model tier when no explicit model", async () => {
    vi.mocked(getTenantAIPreferences).mockResolvedValue({
      modelTier: "low",
      fallbackEnabled: true,
    });
    mockInvokeVision.mockResolvedValue(makeResult("openai", "gpt-4o-mini"));

    await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      tenantId: "t1",
      maxTokens: 512,
    });

    expect(mockInvokeVision).toHaveBeenCalledWith(
      "https://example.com/img.jpg",
      expect.objectContaining({ model: "gpt-4o-mini", maxTokens: 512 })
    );
  });
});
