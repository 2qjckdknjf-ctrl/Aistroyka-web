import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn(() => ({
    OPENAI_API_KEY: "sk-env",
    OPENAI_COPILOT_MODEL: "gpt-4o-mini",
    OPENAI_COPILOT_TIMEOUT_MS: 55_000,
    OPENAI_COPILOT_MAX_RETRIES: 2,
    OPENAI_VISION_MODEL: "gpt-4o",
    OPENAI_VISION_TIMEOUT_MS: 85_000,
    OPENAI_RETRY_ON_5XX: 1,
    AI_ANALYSIS_URL: "",
    AI_REQUEST_TIMEOUT_MS: 90_000,
    AI_RETRY_ATTEMPTS: 3,
    SUPABASE_SERVICE_ROLE_KEY: "",
    NODE_ENV: "test",
  })),
}));

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
