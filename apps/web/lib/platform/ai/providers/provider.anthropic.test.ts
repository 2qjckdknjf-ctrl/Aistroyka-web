import { describe, expect, it, vi, beforeEach } from "vitest";
import { anthropicProvider, invokeVision } from "./provider.anthropic";

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn(),
}));

const getServerConfig = await import("@/lib/config/server").then((m) => m.getServerConfig as ReturnType<typeof vi.fn>);

describe("provider.anthropic", () => {
  beforeEach(() => {
    vi.mocked(getServerConfig).mockReturnValue({
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_VISION_MODEL: "claude-3-5-sonnet-20241022",
    } as any);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve("") })
    );
  });

  it("returns null when ANTHROPIC_API_KEY is missing", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_VISION_MODEL: "claude-3-5-sonnet-20241022",
    } as any);
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when ANTHROPIC_API_KEY is whitespace", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      ANTHROPIC_API_KEY: "   ",
      ANTHROPIC_VISION_MODEL: "claude-3-5-sonnet-20241022",
    } as any);
    const result = await invokeVision("https://example.com/img.jpg");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses success response into VisionResult", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      ANTHROPIC_API_KEY: "sk-ant-test",
      ANTHROPIC_VISION_MODEL: "claude-3-5-sonnet-20241022",
    } as any);
    const fixture = {
      content: [{ type: "text", text: '{"stage":"foundation","completion_percent":45,"risk_level":"medium","detected_issues":[],"recommendations":[]}' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fixture),
    } as Response);

    const result = await invokeVision("https://example.com/photo.jpg", { maxTokens: 1024 });

    expect(result).not.toBeNull();
    expect(result!.providerUsed).toBe("anthropic");
    expect(result!.modelUsed).toBe("claude-3-5-sonnet-20241022");
    expect(result!.content).toContain("stage");
    expect(result!.usage).toEqual({ prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 });
  });

  it("builds request to Anthropic Messages API with image URL", async () => {
    vi.mocked(getServerConfig).mockReturnValue({
      ANTHROPIC_API_KEY: "sk-ant-test",
      ANTHROPIC_VISION_MODEL: "claude-3-5-sonnet-20241022",
    } as any);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: "text", text: "{}" }], usage: {} }),
    } as Response);

    await invokeVision("https://cdn.example.com/site.jpg", { model: "claude-3-5-haiku", maxTokens: 512 });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": "sk-ant-test",
          "anthropic-version": "2023-06-01",
        }),
      })
    );
    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.model).toBe("claude-3-5-haiku");
    expect(body.max_tokens).toBe(512);
    expect(body.messages[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text" }),
        expect.objectContaining({ type: "image", source: { type: "url", url: "https://cdn.example.com/site.jpg" } }),
      ])
    );
  });

  it("provider export has name and invokeVision", () => {
    expect(anthropicProvider.name).toBe("anthropic");
    expect(typeof anthropicProvider.invokeVision).toBe("function");
  });
});
