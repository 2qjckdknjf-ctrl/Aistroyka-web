import { describe, expect, it, vi } from "vitest";
import { evaluateFlags } from "./flags.service";

const mockListFlags = vi.fn();
const mockGetTenantOverrides = vi.fn();
vi.mock("./flags.repository", () => ({
  listFlags: (...args: unknown[]) => mockListFlags(...args),
  getTenantOverrides: (...args: unknown[]) => mockGetTenantOverrides(...args),
}));

describe("flags.service", () => {
  it("returns empty when no flags defined", async () => {
    mockListFlags.mockResolvedValue([]);
    mockGetTenantOverrides.mockResolvedValue([]);
    const result = await evaluateFlags({} as any, "t1");
    expect(result).toEqual({});
  });

  it("uses tenant override when present", async () => {
    mockListFlags.mockResolvedValue([
      { key: "new_ui", description: null, rollout_percent: null, allowlist_tenant_ids: null, created_at: "" },
    ]);
    mockGetTenantOverrides.mockResolvedValue([
      { tenant_id: "t1", key: "new_ui", enabled: true, variant: "v2", updated_at: "" },
    ]);
    const result = await evaluateFlags({} as any, "t1");
    expect(result.new_ui).toEqual({ enabled: true, variant: "v2" });
  });

  it("uses allowlist when no override", async () => {
    mockListFlags.mockResolvedValue([
      { key: "beta", description: null, rollout_percent: null, allowlist_tenant_ids: ["t1"], created_at: "" },
    ]);
    mockGetTenantOverrides.mockResolvedValue([]);
    const result = await evaluateFlags({} as any, "t1");
    expect(result.beta).toEqual({ enabled: true, variant: null });
  });

  it("returns disabled when tenant null and no global rollout", async () => {
    mockListFlags.mockResolvedValue([
      { key: "new_ui", description: null, rollout_percent: 50, allowlist_tenant_ids: null, created_at: "" },
    ]);
    mockGetTenantOverrides.mockResolvedValue([]);
    const result = await evaluateFlags({} as any, null);
    expect(result.new_ui?.enabled).toBe(false);
  });
});
