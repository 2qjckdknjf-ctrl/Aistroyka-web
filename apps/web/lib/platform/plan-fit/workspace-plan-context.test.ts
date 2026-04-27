import { describe, expect, it } from "vitest";
import {
  resolveWorkspacePlanContext,
  getWorkspacePlanContext,
} from "./workspace-plan-context";

describe("workspace plan context", () => {
  describe("resolveWorkspacePlanContext", () => {
    it("builds context from canonical planCode", () => {
      const ctx = resolveWorkspacePlanContext({
        workspaceId: "ws-1",
        planCode: "team_contractor",
        addOnCodes: ["extra_users"],
      });
      expect(ctx.workspaceId).toBe("ws-1");
      expect(ctx.canonicalPlanCode).toBe("team_contractor");
      expect(ctx.sourceKind).toBe("canonical_plan");
      expect(ctx.sourceLegacyTier).toBeUndefined();
      expect(ctx.addOnCodes).toContain("extra_users");
      expect(ctx.effectiveEntitlements.limits.maxUsers).toBe(20 + 10);
      expect(ctx.notes).toBeUndefined();
    });
    it("builds context from legacy tier via bridge", () => {
      const ctx = resolveWorkspacePlanContext({
        workspaceId: "ws-2",
        legacyTier: "FREE",
      });
      expect(ctx.canonicalPlanCode).toBe("client_personal");
      expect(ctx.sourceKind).toBe("legacy_tier_bridge");
      expect(ctx.sourceLegacyTier).toBe("FREE");
      expect(ctx.notes?.some((n) => n.includes("legacy tier"))).toBe(true);
    });
    it("legacy PRO maps to team_contractor", () => {
      const ctx = resolveWorkspacePlanContext({
        workspaceId: "ws-3",
        legacyTier: "PRO",
      });
      expect(ctx.canonicalPlanCode).toBe("team_contractor");
      expect(ctx.sourceLegacyTier).toBe("PRO");
    });
    it("legacy ENTERPRISE maps to enterprise", () => {
      const ctx = resolveWorkspacePlanContext({
        workspaceId: "ws-4",
        legacyTier: "ENTERPRISE",
      });
      expect(ctx.canonicalPlanCode).toBe("enterprise");
    });
    it("defaults to client_personal when neither planCode nor legacyTier", () => {
      const ctx = resolveWorkspacePlanContext({ workspaceId: "ws-5" });
      expect(ctx.canonicalPlanCode).toBe("client_personal");
      expect(ctx.sourceKind).toBe("canonical_plan");
    });
    it("includes usageSnapshot and trialEndsAt when provided", () => {
      const ctx = resolveWorkspacePlanContext({
        workspaceId: "ws-6",
        planCode: "business_operations",
        usageSnapshot: {
          activeUsersCount: 10,
          activeProjectsCount: 5,
          storageUsedGb: 100,
          aiRequestsCount: 500,
        },
        trialEndsAt: "2026-04-01",
      });
      expect(ctx.usageSnapshot?.activeUsersCount).toBe(10);
      expect(ctx.trialEndsAt).toBe("2026-04-01");
    });
  });

  describe("getWorkspacePlanContext", () => {
    it("is alias for resolveWorkspacePlanContext", () => {
      const input = { workspaceId: "ws-a", planCode: "enterprise" as const };
      expect(getWorkspacePlanContext(input).canonicalPlanCode).toBe(
        resolveWorkspacePlanContext(input).canonicalPlanCode
      );
    });
  });
});
