import { describe, expect, it } from "vitest";
import {
  resolveBasePlanEntitlements,
  resolveEffectiveWorkspaceEntitlements,
} from "./resolve";

describe("effective entitlement resolution", () => {
  describe("resolveBasePlanEntitlements", () => {
    it("returns same limits as getPlanEntitlements for team_contractor", () => {
      const ent = resolveBasePlanEntitlements("team_contractor");
      expect(ent.limits.maxUsers).toBe(20);
      expect(ent.limits.maxProjects).toBe(15);
      expect(ent.capabilities.tasks).toBe(true);
    });
  });

  describe("resolveEffectiveWorkspaceEntitlements", () => {
    it("returns base when no add-ons", () => {
      const r = resolveEffectiveWorkspaceEntitlements({
        planCode: "business_operations",
      });
      expect(r.sourcePlanCode).toBe("business_operations");
      expect(r.appliedAddOnCodes).toEqual([]);
      expect(r.effectiveLimits.maxUsers).toBe(100);
      expect(r.warnings).toEqual([]);
    });
    it("applies add-ons and returns effective limits/capabilities", () => {
      const r = resolveEffectiveWorkspaceEntitlements({
        planCode: "business_operations",
        addOnCodes: ["extra_users", "extra_storage", "premium_support"],
      });
      expect(r.appliedAddOnCodes).toContain("extra_users");
      expect(r.appliedAddOnCodes).toContain("extra_storage");
      expect(r.appliedAddOnCodes).toContain("premium_support");
      expect(r.effectiveLimits.maxUsers).toBe(100 + 10);
      expect(r.effectiveLimits.maxStorageGb).toBe(500 + 50);
      expect(r.effectiveCapabilities.prioritySupport).toBe(true);
    });
    it("applies overrides last", () => {
      const r = resolveEffectiveWorkspaceEntitlements({
        planCode: "client_personal",
        overrides: {
          limits: { maxUsers: 5 },
        },
      });
      expect(r.effectiveLimits.maxUsers).toBe(5);
      expect(r.meta?.hadOverrides).toBe(true);
    });
    it("skips disallowed add-ons and adds warnings", () => {
      const r = resolveEffectiveWorkspaceEntitlements({
        planCode: "client_personal",
        addOnCodes: ["extra_users", "sla_pack"],
      });
      expect(r.appliedAddOnCodes).toContain("extra_users");
      expect(r.appliedAddOnCodes).not.toContain("sla_pack");
      expect(r.warnings.some((w) => w.includes("sla_pack"))).toBe(true);
    });
  });
});
