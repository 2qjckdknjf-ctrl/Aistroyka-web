import { describe, expect, it, vi, beforeEach } from "vitest";
import { geminiProvider, invokeVision } from "./provider.gemini";

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn(),
}));

const getServerConfig = await import("@/lib/config/server").then((m) => m.getServerConfig as ReturnType<typeof vi.fn>);

describe("provider.gemini", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.mocked(getServerConfig).mockReturnValue({
      GOOGLE_AI_API_KEY: "",
      GEMINI_VISION_MODEL: "gemini-1.5-flash",
    } as any);
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", mockFetch);
  });

  it("returns null when GOOGLE_AI_API_KEY is missing", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      GOOGLE_AI_API_KEY: "",
      GEMINI_VISION_MODEL: "gemini-1.5-flash",
    } as any);
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("parses success response into VisionResult", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      GOOGLE_AI_API_KEY: "test-key",
      GEMINI_VISION_MODEL: "gemini-1.5-flash",
    } as any);
    const smallImageBlob = new Blob([new Uint8Array(4)], { type: "image/jpeg" });
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(smallImageBlob),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: '{"stage":"framing","completion_percent":60,"risk_level":"low","detected_issues":[],"recommendations":[]}' }] } }],
            usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 80, totalTokenCount: 280 },
          }),
      } as Response);

    const result = await invokeVision("https://example.com/photo.jpg", { maxTokens: 1024 });

    expect(result).not.toBeNull();
    expect(result!.providerUsed).toBe("gemini");
    expect(result!.modelUsed).toBe("gemini-1.5-flash");
    expect(result!.content).toContain("stage");
    expect(result!.usage).toEqual({ prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 });
  });

  it("provider export has name and invokeVision", () => {
    expect(geminiProvider.name).toBe("gemini");
    expect(typeof geminiProvider.invokeVision).toBe("function");
  });
});
