import { describe, expect, it } from "vitest";
import { resolveWorkspaceCapabilities } from "./application-capability";
import { resolveWorkspacePlanContext } from "./workspace-plan-context";

describe("resolveWorkspaceCapabilities", () => {
  it("returns limits and capabilities from context (canonical source)", () => {
    const ctx = resolveWorkspacePlanContext({
      workspaceId: "ws-1",
      planCode: "business_operations",
    });
    const snap = resolveWorkspaceCapabilities(ctx);
    expect(snap.limits.maxUsers).toBe(100);
    expect(snap.capabilities.advancedApprovals).toBe(true);
    expect(snap.capabilities.portfolioAnalytics).toBe(true);
  });
  it("returns effective capabilities after add-ons", () => {
    const ctx = resolveWorkspacePlanContext({
      workspaceId: "ws-2",
      planCode: "team_contractor",
      addOnCodes: ["premium_support"],
    });
    const snap = resolveWorkspaceCapabilities(ctx);
    expect(snap.capabilities.prioritySupport).toBe(true);
  });
  it("returns capabilities from context built via legacy tier bridge", () => {
    const ctx = resolveWorkspacePlanContext({
      workspaceId: "ws-3",
      legacyTier: "ENTERPRISE",
    });
    const snap = resolveWorkspaceCapabilities(ctx);
    expect(snap.capabilities.sso).toBe(true);
    expect(snap.capabilities.auditLogs).toBe(true);
    expect(snap.limits.maxUsers).toBeGreaterThanOrEqual(1000);
  });
});
