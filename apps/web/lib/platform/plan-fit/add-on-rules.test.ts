import { describe, expect, it } from "vitest";
import {
  isAddOnAllowedForPlan,
  applyAddOnToEntitlements,
  applyAddOnsToEntitlements,
} from "./add-on-rules";
import { getPlanEntitlements } from "./plans";

describe("add-on rules", () => {
  describe("isAddOnAllowedForPlan", () => {
    it("allows extra_users for all plans", () => {
      expect(isAddOnAllowedForPlan("client_personal", "extra_users")).toBe(true);
      expect(isAddOnAllowedForPlan("enterprise", "extra_users")).toBe(true);
    });
    it("forbids integration_pack for client_personal and team_contractor", () => {
      expect(isAddOnAllowedForPlan("client_personal", "integration_pack")).toBe(false);
      expect(isAddOnAllowedForPlan("team_contractor", "integration_pack")).toBe(false);
    });
    it("allows integration_pack for business_operations and enterprise", () => {
      expect(isAddOnAllowedForPlan("business_operations", "integration_pack")).toBe(true);
      expect(isAddOnAllowedForPlan("enterprise", "integration_pack")).toBe(true);
    });
    it("forbids security_pack and sla_pack for client_personal", () => {
      expect(isAddOnAllowedForPlan("client_personal", "security_pack")).toBe(false);
      expect(isAddOnAllowedForPlan("client_personal", "sla_pack")).toBe(false);
    });
  });

  describe("applyAddOnToEntitlements", () => {
    it("skips integration_pack for team_contractor with not_allowed_for_plan", () => {
      const base = getPlanEntitlements("team_contractor");
      const r = applyAddOnToEntitlements(base, "team_contractor", "integration_pack");
      expect(r.applied).toBe(false);
      expect(r.skippedReason).toBe("not_allowed_for_plan");
    });
    it("applies extra_users with limitsDelta", () => {
      const base = getPlanEntitlements("business_operations");
      const r = applyAddOnToEntitlements(base, "business_operations", "extra_users");
      expect(r.applied).toBe(true);
      expect(r.limitsDelta).toEqual({ maxUsers: 10 });
    });
    it("applies premium_support with capabilitiesGranted", () => {
      const base = getPlanEntitlements("team_contractor");
      const r = applyAddOnToEntitlements(base, "team_contractor", "premium_support");
      expect(r.applied).toBe(true);
      expect(r.capabilitiesGranted).toEqual({ prioritySupport: true });
    });
    it("skips future_budget_cost with no_effect", () => {
      const base = getPlanEntitlements("enterprise");
      const r = applyAddOnToEntitlements(base, "enterprise", "future_budget_cost");
      expect(r.applied).toBe(false);
      expect(r.skippedReason).toBe("no_effect");
    });
  });

  describe("applyAddOnsToEntitlements", () => {
    it("business_operations + extra_users + extra_storage increases limits", () => {
      const base = getPlanEntitlements("business_operations");
      const result = applyAddOnsToEntitlements(base, "business_operations", [
        "extra_users",
        "extra_storage",
      ]);
      expect(result.effectiveLimits.maxUsers).toBe(100 + 10);
      expect(result.effectiveLimits.maxStorageGb).toBe(500 + 50);
      expect(result.appliedAddOns).toContain("extra_users");
      expect(result.appliedAddOns).toContain("extra_storage");
    });
    it("team_contractor + integration_pack skips add-on and adds warning", () => {
      const base = getPlanEntitlements("team_contractor");
      const result = applyAddOnsToEntitlements(base, "team_contractor", ["integration_pack"]);
      expect(result.appliedAddOns).not.toContain("integration_pack");
      expect(result.skipped.some((s) => s.addOnCode === "integration_pack" && s.skippedReason === "not_allowed_for_plan")).toBe(true);
      expect(result.warnings.some((w) => w.includes("integration_pack") && w.includes("team_contractor"))).toBe(true);
    });
    it("client_personal + security_pack and sla_pack are skipped", () => {
      const base = getPlanEntitlements("client_personal");
      const result = applyAddOnsToEntitlements(base, "client_personal", [
        "security_pack",
        "sla_pack",
      ]);
      expect(result.appliedAddOns).toEqual([]);
      expect(result.warnings.length).toBe(2);
    });
    it("enterprise + security_pack applies auditLogs", () => {
      const base = getPlanEntitlements("enterprise");
      const result = applyAddOnsToEntitlements(base, "enterprise", ["security_pack"]);
      expect(result.effectiveCapabilities.auditLogs).toBe(true);
      expect(result.appliedAddOns).toContain("security_pack");
    });
  });
});
