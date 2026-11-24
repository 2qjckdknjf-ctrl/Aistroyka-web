import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTenantAIPreferences } from "./tenant-ai-preferences";

function mockClient(result: { data: unknown; error: unknown }) {
  const inFn = vi.fn().mockResolvedValue(result);
  const eqFn = vi.fn(() => ({ in: inFn }));
  const selectFn = vi.fn(() => ({ eq: eqFn }));
  const fromFn = vi.fn(() => ({ select: selectFn }));
  return { from: fromFn } as never;
}

describe("getTenantAIPreferences fail-closed fallback", () => {
  const original = process.env.AI_FALLBACK_ON_ERROR;

  beforeEach(() => {
    delete process.env.AI_FALLBACK_ON_ERROR;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.AI_FALLBACK_ON_ERROR;
    else process.env.AI_FALLBACK_ON_ERROR = original;
  });

  it("defaults fallbackEnabled=false when tenantId is null", async () => {
    const prefs = await getTenantAIPreferences(mockClient({ data: null, error: null }), null);
    expect(prefs.fallbackEnabled).toBe(false);
  });

  it("defaults fallbackEnabled=false when flag read errors", async () => {
    const prefs = await getTenantAIPreferences(
      mockClient({ data: null, error: { message: "boom" } }),
      "tenant-1"
    );
    expect(prefs.fallbackEnabled).toBe(false);
  });

  it("allows opt-in open fallback via AI_FALLBACK_ON_ERROR=true", async () => {
    process.env.AI_FALLBACK_ON_ERROR = "true";
    const prefs = await getTenantAIPreferences(mockClient({ data: null, error: null }), null);
    expect(prefs.fallbackEnabled).toBe(true);
  });

  it("honors tenant ai_fallback_enabled flag when present", async () => {
    const prefs = await getTenantAIPreferences(
      mockClient({
        data: [{ key: "ai_fallback_enabled", enabled: false, variant: null }],
        error: null,
      }),
      "tenant-1"
    );
    expect(prefs.fallbackEnabled).toBe(false);
  });
});
