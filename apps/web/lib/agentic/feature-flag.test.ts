import { afterEach, describe, expect, it, vi } from "vitest";
import { isAgenticFoundationEnabled, resolveAgenticFoundationMode } from "./feature-flag";

vi.mock("@/lib/platform/flags/flags.service", () => ({
  evaluateFlags: vi.fn().mockResolvedValue({ AGENTIC_FOUNDATION_ENABLED: { enabled: true } }),
}));

describe("agentic feature flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to disabled", () => {
    vi.stubEnv("AGENTIC_FOUNDATION_MODE", "");
    expect(resolveAgenticFoundationMode()).toBe("disabled");
  });

  it("is off when mode is disabled even if DB would enable", async () => {
    vi.stubEnv("AGENTIC_FOUNDATION_MODE", "disabled");
    const enabled = await isAgenticFoundationEnabled({} as never, "t1");
    expect(enabled).toBe(false);
  });

  it("enables in internal mode outside production", async () => {
    vi.stubEnv("AGENTIC_FOUNDATION_MODE", "internal");
    vi.stubEnv("NODE_ENV", "development");
    const enabled = await isAgenticFoundationEnabled({} as never, "t1");
    expect(enabled).toBe(true);
  });
});
