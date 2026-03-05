import { describe, expect, it, vi } from "vitest";
import { getEntitlements, limitsFromEntitlements } from "./entitlements.service";

vi.mock("../subscription/limits", () => ({
  getLimitsForTier: (tier: string) => ({
    tier,
    monthly_ai_budget_usd: tier === "PRO" ? 50 : tier === "ENTERPRISE" ? 500 : 5,
    per_minute_rate_limit_tenant: 10,
    per_minute_rate_limit_ip: 5,
    max_projects: tier === "PRO" ? 20 : tier === "ENTERPRISE" ? 500 : 3,
    max_workers: tier === "PRO" ? 15 : tier === "ENTERPRISE" ? 200 : 2,
    storage_limit_gb: tier === "PRO" ? 10 : tier === "ENTERPRISE" ? 100 : 1,
  }),
  DEFAULT_TIER: "FREE",
}));

describe("entitlements.service", () => {
  describe("getEntitlements", () => {
    it("returns null when no row", async () => {
      const supabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      } as any;
      const result = await getEntitlements(supabase, "t1");
      expect(result).toBeNull();
    });
  });

  describe("limitsFromEntitlements", () => {
    it("returns fallback when entitlements null", () => {
      const fallback = {
        tier: "FREE" as const,
        monthly_ai_budget_usd: 5,
        per_minute_rate_limit_tenant: 10,
        per_minute_rate_limit_ip: 5,
        max_projects: 3,
        max_workers: 2,
        storage_limit_gb: 1,
      };
      const result = limitsFromEntitlements(null, fallback);
      expect(result).toEqual(fallback);
    });

    it("overrides with entitlements row", () => {
      const fallback = {
        tier: "PRO" as const,
        monthly_ai_budget_usd: 50,
        per_minute_rate_limit_tenant: 60,
        per_minute_rate_limit_ip: 20,
        max_projects: 20,
        max_workers: 15,
        storage_limit_gb: 10,
      };
      const ent = {
        tenant_id: "t1",
        tier: "PRO",
        ai_budget_usd: 100,
        max_projects: 50,
        max_workers: 30,
        storage_limit_gb: 25,
        updated_at: "",
      };
      const result = limitsFromEntitlements(ent, fallback);
      expect(result.monthly_ai_budget_usd).toBe(100);
      expect(result.max_projects).toBe(50);
      expect(result.max_workers).toBe(30);
      expect(result.storage_limit_gb).toBe(25);
    });
  });
});
