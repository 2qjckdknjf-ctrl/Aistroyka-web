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
import { ProviderRequestError } from "./provider.errors";
import { getProviderAllowlist, invokeVisionWithRouter, orderProvidersForTest } from "./provider.router";

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
    vi.stubEnv("AI_PROVIDER_ALLOWLIST", undefined);
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
    vi.unstubAllEnvs();
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

  it("falls back when preferred provider returns auth error", async () => {
    mockInvokeVision.mockRejectedValue(
      new ProviderRequestError("OpenAI unauthorized", "auth", 401)
    );
    mockAnthropicInvoke.mockResolvedValue(
      makeResult("anthropic", "claude-sonnet-4-20250514")
    );

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      maxTokens: 1024,
    });

    expect(result).not.toBeNull();
    expect(result?.providerUsed).toBe("anthropic");
    expect(recordFailure).toHaveBeenCalledWith(supabase, "openai");
    expect(recordSuccess).toHaveBeenCalledWith(supabase, "anthropic");
  });

  it("falls back when preferred provider returns invalid_input error", async () => {
    mockInvokeVision.mockRejectedValue(
      new ProviderRequestError("OpenAI invalid request", "invalid_input", 400)
    );
    mockAnthropicInvoke.mockResolvedValue(
      makeResult("anthropic", "claude-sonnet-4-20250514")
    );

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      maxTokens: 1024,
    });

    expect(result).not.toBeNull();
    expect(result?.providerUsed).toBe("anthropic");
    expect(recordFailure).toHaveBeenCalledWith(supabase, "openai");
    expect(recordSuccess).toHaveBeenCalledWith(supabase, "anthropic");
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

  it("never invokes providers outside AI_PROVIDER_ALLOWLIST", async () => {
    vi.stubEnv("AI_PROVIDER_ALLOWLIST", "anthropic");
    expect([...getProviderAllowlist()]).toEqual(["anthropic"]);
    const ordered = orderProvidersForTest("openai", true);
    expect(ordered.map((p) => p.name)).toEqual(["anthropic"]);

    mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));
    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {
      maxTokens: 1024,
    });
    expect(result?.providerUsed).toBe("anthropic");
    expect(mockInvokeVision).not.toHaveBeenCalled();
    expect(mockGeminiInvoke).not.toHaveBeenCalled();
  });

  it.each(["claude", "google,unknown", ", ,"])(
    "invokes nobody when the non-empty operator allowlist is invalid: %s",
    async (allowlist) => {
      vi.stubEnv("AI_PROVIDER_ALLOWLIST", allowlist);
      mockInvokeVision.mockResolvedValue(makeResult("openai", "gpt-4o"));
      mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));
      mockGeminiInvoke.mockResolvedValue(makeResult("gemini", "gemini-2.5-flash"));

      const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {});

      expect(result).toBeNull();
      expect([...getProviderAllowlist()]).toEqual([]);
      expect(canInvoke).not.toHaveBeenCalled();
      expect(mockInvokeVision).not.toHaveBeenCalled();
      expect(mockAnthropicInvoke).not.toHaveBeenCalled();
      expect(mockGeminiInvoke).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "", "  "])("allows built-in providers for unset or blank allowlist", (allowlist) => {
    vi.stubEnv("AI_PROVIDER_ALLOWLIST", allowlist);
    expect([...getProviderAllowlist()]).toEqual(["openai", "anthropic", "gemini"]);
  });

  it.each(["failed", "circuit-open"])(
    "does not try another default provider when fallback is disabled and the first is %s",
    async (state) => {
      vi.mocked(getTenantAIPreferences).mockResolvedValue({ fallbackEnabled: false });
      vi.mocked(canInvoke).mockResolvedValue(state !== "circuit-open");
      mockInvokeVision.mockResolvedValue(null);
      mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));
      mockGeminiInvoke.mockResolvedValue(makeResult("gemini", "gemini-2.5-flash"));

      const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {});

      expect(result).toBeNull();
      expect(canInvoke).toHaveBeenCalledTimes(1);
      expect(canInvoke).toHaveBeenCalledWith(supabase, "openai");
      expect(mockAnthropicInvoke).not.toHaveBeenCalled();
      expect(mockGeminiInvoke).not.toHaveBeenCalled();
    }
  );

  it("does not replace a forbidden tenant preference when fallback is disabled", async () => {
    vi.stubEnv("AI_PROVIDER_ALLOWLIST", "anthropic,gemini");
    vi.mocked(getTenantAIPreferences).mockResolvedValue({
      providerPreference: "openai",
      fallbackEnabled: false,
    });
    mockAnthropicInvoke.mockResolvedValue(makeResult("anthropic", "claude-sonnet-4-20250514"));

    const result = await invokeVisionWithRouter(supabase, "https://example.com/img.jpg", {});

    expect(result).toBeNull();
    expect(canInvoke).not.toHaveBeenCalled();
    expect(mockInvokeVision).not.toHaveBeenCalled();
    expect(mockAnthropicInvoke).not.toHaveBeenCalled();
    expect(mockGeminiInvoke).not.toHaveBeenCalled();
  });
});
