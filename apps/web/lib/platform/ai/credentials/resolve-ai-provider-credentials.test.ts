import { afterEach, describe, expect, it } from "vitest";
import {
  parseTenantProviderKeyMap,
  resolveAiProviderCredentials,
} from "./resolve-ai-provider-credentials";

describe("resolveAiProviderCredentials (D3b)", () => {
  const keys = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_AI_API_KEY",
    "GEMINI_API_KEY",
    "AI_TENANT_PROVIDER_KEYS_JSON",
  ] as const;
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
    setEnv("AI_TENANT_PROVIDER_KEYS_JSON", undefined);
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
    setEnv("AI_TENANT_PROVIDER_KEYS_JSON", undefined);
    const creds = resolveAiProviderCredentials("anthropic", null);
    expect(creds).toEqual({
      provider: "anthropic",
      apiKey: null,
      source: "missing",
      tenantScoped: false,
      rotationHint: "missing",
    });
  });

  it("prefers tenant map over global env when tenantId matches", () => {
    setEnv("OPENAI_API_KEY", "sk-global");
    setEnv(
      "AI_TENANT_PROVIDER_KEYS_JSON",
      JSON.stringify({ "tenant-1": { openai: "sk-tenant-only" } })
    );
    const creds = resolveAiProviderCredentials("openai", "tenant-1");
    expect(creds.source).toBe("tenant_env_map");
    expect(creds.tenantScoped).toBe(true);
    expect(creds.apiKey).toBe("sk-tenant-only");
    expect(creds.rotationHint).toBe("use_tenant_map_rotation");
  });

  it("falls back to global when tenant has no provider entry", () => {
    setEnv("ANTHROPIC_API_KEY", "sk-anth-global");
    setEnv(
      "AI_TENANT_PROVIDER_KEYS_JSON",
      JSON.stringify({ "tenant-1": { openai: "sk-tenant-only" } })
    );
    const creds = resolveAiProviderCredentials("anthropic", "tenant-1");
    expect(creds.source).toBe("global_env");
    expect(creds.apiKey).toBe("sk-anth-global");
  });

  it("parseTenantProviderKeyMap rejects invalid JSON", () => {
    expect(parseTenantProviderKeyMap("{")).toBeNull();
    expect(parseTenantProviderKeyMap("[]")).toBeNull();
    expect(parseTenantProviderKeyMap('{"t":{"openai":"x"}}')).toEqual({
      t: { openai: "x" },
    });
  });
});
