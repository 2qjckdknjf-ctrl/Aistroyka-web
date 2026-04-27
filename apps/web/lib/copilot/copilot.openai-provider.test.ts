import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOpenAiCopilotProvider } from "./copilot.openai-provider";

describe("createOpenAiCopilotProvider", () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "On track",
                    bullets: ["A", "B"],
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 50 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns structured JSON and invokes onUsage", async () => {
    const onUsage = vi.fn();
    const provider = createOpenAiCopilotProvider({
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      onUsage,
    });
    expect(provider.isAvailable()).toBe(true);

    const ctx = {
      projectId: "p1",
      tenantId: "t1",
      snapshotSummary: "",
      healthSummary: "",
      reportSummary: "",
      riskSummary: "",
      evidenceSummary: "",
      taskSummary: "",
      recommendationsSummary: "",
    };

    const out = await provider.generateFromPrompt("ctx block", "generateManagerBrief", ctx);
    expect(out.structured?.summary).toBe("On track");
    expect(out.usageMeta?.promptTokens).toBe(100);
    expect(onUsage).toHaveBeenCalledTimes(1);
    expect(onUsage.mock.calls[0][0].model).toBe("gpt-4o-mini");
  });

  it("is unavailable without api key", () => {
    const provider = createOpenAiCopilotProvider({ apiKey: "" });
    expect(provider.isAvailable()).toBe(false);
  });
});
