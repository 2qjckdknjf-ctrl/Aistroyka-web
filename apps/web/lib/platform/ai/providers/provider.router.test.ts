import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCanInvoke = vi.fn();
const mockRecordSuccess = vi.fn();
const mockRecordFailure = vi.fn();
const mockGetTenantAiPreferences = vi.fn();
const mockOrderProviderNames = vi.fn();
const openaiInvoke = vi.fn();
const anthropicInvoke = vi.fn();
const geminiInvoke = vi.fn();

vi.mock("./circuit-breaker", () => ({
  canInvoke: (...args: unknown[]) => mockCanInvoke(...args),
  recordSuccess: (...args: unknown[]) => mockRecordSuccess(...args),
  recordFailure: (...args: unknown[]) => mockRecordFailure(...args),
}));
vi.mock("@/lib/platform/ai/routing/tenant-ai-preferences", () => ({
  getTenantAiPreferences: (...args: unknown[]) => mockGetTenantAiPreferences(...args),
  orderProviderNames: (...args: unknown[]) => mockOrderProviderNames(...args),
}));
vi.mock("@/lib/platform/ai/routing/models", () => ({
  getModelForProvider: (name: string, _tier: string) => (name === "openai" ? "gpt-4o" : name === "anthropic" ? "claude-3-5-sonnet" : "gemini-1.5-flash"),
}));
vi.mock("./provider.openai", () => ({ openaiProvider: { name: "openai", invokeVision: (...args: unknown[]) => openaiInvoke(...args) } }));
vi.mock("./provider.anthropic", () => ({ anthropicProvider: { name: "anthropic", invokeVision: (...args: unknown[]) => anthropicInvoke(...args) } }));
vi.mock("./provider.gemini", () => ({ geminiProvider: { name: "gemini", invokeVision: (...args: unknown[]) => geminiInvoke(...args) } }));

const { invokeVisionWithRouter } = await import("./provider.router");

describe("provider.router", () => {
  const supabase = {} as any;
  const imageUrl = "https://example.com/photo.jpg";

  beforeEach(() => {
    vi.mocked(mockCanInvoke).mockResolvedValue(true);
    vi.mocked(mockRecordSuccess).mockResolvedValue(undefined);
    vi.mocked(mockRecordFailure).mockResolvedValue(undefined);
    vi.mocked(mockGetTenantAiPreferences).mockResolvedValue({ preferredProvider: null, fallbackEnabled: true });
    vi.mocked(mockOrderProviderNames).mockImplementation((_pref: string | null, def: string[]) => def);
    openaiInvoke.mockResolvedValue(null);
    anthropicInvoke.mockResolvedValue(null);
    geminiInvoke.mockResolvedValue(null);
  });

  it("chooses preferred provider when set and it returns result", async () => {
    vi.mocked(mockGetTenantAiPreferences).mockResolvedValue({ preferredProvider: "anthropic", fallbackEnabled: true });
    vi.mocked(mockOrderProviderNames).mockReturnValue(["anthropic", "openai", "gemini"]);
    const result = { content: "{}", providerUsed: "anthropic", modelUsed: "claude-3-5-sonnet" };
    anthropicInvoke.mockResolvedValueOnce(result);

    const out = await invokeVisionWithRouter(supabase, imageUrl, { tier: "free", tenantId: "t1" });

    expect(out).toEqual(result);
    expect(anthropicInvoke).toHaveBeenCalled();
    expect(openaiInvoke).not.toHaveBeenCalled();
    expect(mockRecordSuccess).toHaveBeenCalledWith(supabase, "anthropic");
  });

  it("skips provider when canInvoke returns false", async () => {
    vi.mocked(mockCanInvoke).mockImplementation(async (_s, name) => name !== "openai");
    openaiInvoke.mockResolvedValueOnce({ content: "{}", providerUsed: "openai", modelUsed: "gpt-4o" });

    const out = await invokeVisionWithRouter(supabase, imageUrl, { tier: "free" });

    expect(openaiInvoke).not.toHaveBeenCalled();
    expect(anthropicInvoke).toHaveBeenCalled();
  });

  it("falls back to next provider when first fails with retryable error", async () => {
    vi.mocked(mockOrderProviderNames).mockReturnValue(["openai", "anthropic", "gemini"]);
    openaiInvoke.mockRejectedValueOnce(new Error("timeout"));
    const result = { content: "{}", providerUsed: "anthropic", modelUsed: "claude-3-5-sonnet" };
    anthropicInvoke.mockResolvedValueOnce(result);

    const out = await invokeVisionWithRouter(supabase, imageUrl, { tier: "free" });

    expect(out).toEqual(result);
    expect(mockRecordFailure).toHaveBeenCalledWith(supabase, "openai");
    expect(mockRecordSuccess).toHaveBeenCalledWith(supabase, "anthropic");
  });

  it("does not fallback when first fails with non-retryable error (400)", async () => {
    vi.mocked(mockOrderProviderNames).mockReturnValue(["openai", "anthropic", "gemini"]);
    openaiInvoke.mockRejectedValueOnce(new Error("400 invalid request"));
    anthropicInvoke.mockResolvedValueOnce({ content: "{}", providerUsed: "anthropic", modelUsed: "claude" });

    const out = await invokeVisionWithRouter(supabase, imageUrl, { tier: "free" });

    expect(out).toBeNull();
    expect(anthropicInvoke).not.toHaveBeenCalled();
    expect(mockRecordFailure).toHaveBeenCalledWith(supabase, "openai");
  });

  it("returns null when all providers fail or return null", async () => {
    openaiInvoke.mockResolvedValue(null);
    anthropicInvoke.mockResolvedValue(null);
    geminiInvoke.mockResolvedValue(null);

    const out = await invokeVisionWithRouter(supabase, imageUrl, { tier: "free" });

    expect(out).toBeNull();
    expect(mockRecordFailure).not.toHaveBeenCalled();
  });

  it("passes resolved model to provider", async () => {
    vi.mocked(mockOrderProviderNames).mockReturnValue(["openai", "anthropic", "gemini"]);
    openaiInvoke.mockResolvedValueOnce({ content: "{}", providerUsed: "openai", modelUsed: "gpt-4o" });

    await invokeVisionWithRouter(supabase, imageUrl, { tier: "pro", maxTokens: 512 });

    expect(openaiInvoke).toHaveBeenCalledWith(imageUrl, expect.objectContaining({ maxTokens: 512 }));
    expect(openaiInvoke.mock.calls[0][1].model).toBe("gpt-4o");
  });
});
