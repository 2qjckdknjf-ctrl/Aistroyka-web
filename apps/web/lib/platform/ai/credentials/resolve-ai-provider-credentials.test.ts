import { afterEach, describe, expect, it } from "vitest";
import { resolveAiProviderCredentials } from "./resolve-ai-provider-credentials";

describe("resolveAiProviderCredentials (D3b scaffold)", () => {
  const keys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_AI_API_KEY", "GEMINI_API_KEY"] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
      delete saved[key];
    }
  });

  function setEnv(key: (typeof keys)[number], value: string | undefined) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("reads global OpenAI key and marks tenantScoped=false", () => {
    setEnv("OPENAI_API_KEY", "sk-test-not-real-aaaaaaaa");
    const creds = resolveAiProviderCredentials("openai", "tenant-1");
    expect(creds.source).toBe("global_env");
    expect(creds.tenantScoped).toBe(false);
    expect(creds.apiKey).toBe("sk-test-not-real-aaaaaaaa");
    expect(creds.rotationHint).toBe("use_global_env_rotation");
  });

  it("prefers GOOGLE_AI_API_KEY over GEMINI_API_KEY", () => {
    setEnv("GOOGLE_AI_API_KEY", "google-key");
    setEnv("GEMINI_API_KEY", "gemini-key");
    expect(resolveAiProviderCredentials("gemini").apiKey).toBe("google-key");
  });

  it("returns missing when no key configured", () => {
    setEnv("ANTHROPIC_API_KEY", undefined);
    const creds = resolveAiProviderCredentials("anthropic", null);
    expect(creds).toEqual({
      provider: "anthropic",
      apiKey: null,
      source: "missing",
      tenantScoped: false,
      rotationHint: "missing",
    });
  });
});
