import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invokeVision, anthropicProvider } from "./provider.anthropic";
import { ProviderRequestError } from "./provider.errors";

const originalEnv = process.env;

describe("provider.anthropic", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns null when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_VISION_MODEL = "claude-sonnet-4-20250514";
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when ANTHROPIC_API_KEY is empty string", async () => {
    process.env.ANTHROPIC_API_KEY = "";
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
  });

  it("parses success response into VisionResult", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.ANTHROPIC_VISION_MODEL = "claude-sonnet-4-20250514";
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: '{"stage":"foundation","completion_percent":50,"risk_level":"medium","detected_issues":[],"recommendations":[]}' }],
          usage: { input_tokens: 100, output_tokens: 80 },
        }),
    } as Response);

    const result = await invokeVision("https://example.com/img.jpg", { maxTokens: 1024 });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      providerUsed: "anthropic",
      modelUsed: "claude-sonnet-4-20250514",
      content: expect.stringContaining("foundation"),
      usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 },
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "sk-test",
          "anthropic-version": "2023-06-01",
        }),
      })
    );
  });

  it("throws ProviderRequestError on 4xx with invalid_input", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: "Bad request" } }),
    } as Response);

    try {
      await invokeVision("https://example.com/img.jpg");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderRequestError);
      expect((err as ProviderRequestError).code).toBe("invalid_input");
    }
  });

  it("exports anthropicProvider with name and invokeVision", () => {
    expect(anthropicProvider.name).toBe("anthropic");
    expect(typeof anthropicProvider.invokeVision).toBe("function");
  });
});
