import { describe, expect, it } from "vitest";
import { getWorkspacePlanContextFromRuntime } from "./runtime-plan-context.service";
import type { WorkspacePlanRuntimeAdapter } from "./runtime-adapter.types";
import type { WorkspacePlanRuntimeSource } from "./runtime-source.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const noopSupabase = {} as SupabaseClient;

function createAdapter(source: WorkspacePlanRuntimeSource): WorkspacePlanRuntimeAdapter {
  return {
    async getRuntimeSource(_supabase, workspaceId) {
      return { ...source, workspaceId: source.workspaceId || workspaceId };
    },
  };
}

describe("getWorkspacePlanContextFromRuntime", () => {
  it("uses explicit canonical planCode when provided", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-1",
      canonicalPlanCode: "business_operations",
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-1", { adapter });
    expect(ctx.canonicalPlanCode).toBe("business_operations");
    expect(ctx.sourceKind).toBe("canonical_plan");
    expect(ctx.sourceLegacyTier).toBeUndefined();
  });

  it("uses legacy tier bridge when only legacyTier provided", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-2",
      legacyTier: "PRO",
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-2", { adapter });
    expect(ctx.canonicalPlanCode).toBe("team_contractor");
    expect(ctx.sourceKind).toBe("legacy_tier_bridge");
    expect(ctx.sourceLegacyTier).toBe("PRO");
  });

  it("maps legacy ENTERPRISE to enterprise", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-3",
      legacyTier: "ENTERPRISE",
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-3", { adapter });
    expect(ctx.canonicalPlanCode).toBe("enterprise");
    expect(ctx.sourceLegacyTier).toBe("ENTERPRISE");
  });

  it("applies safe default when no plan or tier", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-4",
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-4", { adapter });
    expect(ctx.canonicalPlanCode).toBe("client_personal");
    expect(ctx.sourceKind).toBe("canonical_plan");
    expect(ctx.sourceLegacyTier).toBeUndefined();
  });

  it("prefers canonical plan when both plan and legacy tier set (with warning in notes)", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-5",
      canonicalPlanCode: "enterprise",
      legacyTier: "FREE",
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-5", {
      adapter,
      includeMetaInNotes: true,
    });
    expect(ctx.canonicalPlanCode).toBe("enterprise");
    expect(ctx.notes?.some((n) => n.includes("inconsistent_runtime_plan_data"))).toBe(true);
  });

  it("skips invalid add-on and adds warning when includeMetaInNotes", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-6",
      legacyTier: "PRO",
      addOnCodes: ["extra_users", "invalid_addon" as never],
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-6", {
      adapter,
      includeMetaInNotes: true,
    });
    expect(ctx.canonicalPlanCode).toBe("team_contractor");
    expect(ctx.addOnCodes).toContain("extra_users");
    expect(ctx.addOnCodes).not.toContain("invalid_addon");
    expect(ctx.notes?.some((n) => n.includes("invalid_add_on_code"))).toBe(true);
  });

  it("applies valid add-on codes from source", async () => {
    const adapter = createAdapter({
      workspaceId: "ws-7",
      legacyTier: "PRO",
      addOnCodes: ["extra_users", "premium_support"],
    });
    const ctx = await getWorkspacePlanContextFromRuntime(noopSupabase, "ws-7", { adapter });
    expect(ctx.effectiveEntitlements.limits.maxUsers).toBe(20 + 10);
    expect(ctx.effectiveCapabilities.prioritySupport).toBe(true);
  });
});
