import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invokeVision, geminiProvider } from "./provider.gemini";
import { ProviderRequestError } from "./provider.errors";

const originalEnv = process.env;

describe("provider.gemini", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns null when GOOGLE_AI_API_KEY and GEMINI_API_KEY are missing", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when API key is empty string", async () => {
    process.env.GOOGLE_AI_API_KEY = "";
    process.env.GEMINI_API_KEY = "";
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
  });

  it("uses GEMINI_API_KEY when GOOGLE_AI_API_KEY is not set", async () => {
    process.env.GEMINI_API_KEY = "key-from-gemini";
    delete process.env.GOOGLE_AI_API_KEY;
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{"stage":"framing","completion_percent":60,"risk_level":"low","detected_issues":[],"recommendations":[]}',
                    },
                  ],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 100, totalTokenCount: 300 },
          }),
      } as Response);

    const result = await invokeVision("https://example.com/img.jpg");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      providerUsed: "gemini",
      modelUsed: "gemini-1.5-flash",
      content: expect.stringContaining("framing"),
      usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
    });
    const generateCall = vi.mocked(fetch).mock.calls.find((c) => String(c[0]).includes("generateContent"));
    expect(generateCall?.[0]).toContain("key-from-gemini");
  });

  it("parses success response into VisionResult", async () => {
    process.env.GOOGLE_AI_API_KEY = "key-test";
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: '{"stage":"foundation","completion_percent":50,"risk_level":"medium","detected_issues":[],"recommendations":[]}' }],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 60, totalTokenCount: 210 },
          }),
      } as Response);

    const result = await invokeVision("https://example.com/img.jpg", { maxTokens: 1024 });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      providerUsed: "gemini",
      modelUsed: "gemini-1.5-flash",
      usage: { prompt_tokens: 150, completion_tokens: 60, total_tokens: 210 },
    });
  });

  it("throws ProviderRequestError on image fetch failure", async () => {
    process.env.GOOGLE_AI_API_KEY = "key-test";
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    try {
      await invokeVision("https://example.com/missing.jpg");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderRequestError);
      expect((err as ProviderRequestError).code).toBe("invalid_input");
    }
  });

  it("exports geminiProvider with name and invokeVision", () => {
    expect(geminiProvider.name).toBe("gemini");
    expect(typeof geminiProvider.invokeVision).toBe("function");
  });
});
