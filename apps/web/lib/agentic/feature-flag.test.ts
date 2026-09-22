import { afterEach, describe, expect, it, vi } from "vitest";
import { isAgenticFoundationEnabled, resolveAgenticFoundationMode } from "./feature-flag";

const flagRepoMocks = vi.hoisted(() => ({
  listFlags: vi.fn(),
  getTenantOverrides: vi.fn(),
}));

vi.mock("@/lib/platform/flags/flags.service", () => ({
  evaluateFlags: vi.fn().mockResolvedValue({ AGENTIC_FOUNDATION_ENABLED: { enabled: true } }),
}));

vi.mock("@/lib/platform/flags/flags.repository", () => flagRepoMocks);

const { listFlags, getTenantOverrides } = flagRepoMocks;

describe("agentic feature flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
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

  it("ignores percentage rollout in selected_tenant mode", async () => {
    vi.stubEnv("AGENTIC_FOUNDATION_MODE", "selected_tenant");
    listFlags.mockResolvedValue([
      {
        key: "AGENTIC_FOUNDATION_ENABLED",
        rollout_percent: 100,
        allowlist_tenant_ids: [],
      },
    ]);
    getTenantOverrides.mockResolvedValue([]);

    await expect(isAgenticFoundationEnabled({} as never, "not-selected")).resolves.toBe(false);
  });

  it("allows selected_tenant only by explicit allowlist or override", async () => {
    vi.stubEnv("AGENTIC_FOUNDATION_MODE", "selected_tenant");
    listFlags.mockResolvedValue([
      {
        key: "AGENTIC_FOUNDATION_ENABLED",
        rollout_percent: 0,
        allowlist_tenant_ids: ["allowlisted"],
      },
    ]);
    getTenantOverrides.mockImplementation(async (_client: unknown, tenantId: string) =>
      tenantId === "override" ? [{ key: "AGENTIC_FOUNDATION_ENABLED", enabled: true }] : []
    );

    await expect(isAgenticFoundationEnabled({} as never, "allowlisted")).resolves.toBe(true);
    await expect(isAgenticFoundationEnabled({} as never, "override")).resolves.toBe(true);
    await expect(isAgenticFoundationEnabled({} as never, "other")).resolves.toBe(false);
  });
});
