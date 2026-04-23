import { describe, expect, it, vi } from "vitest";
import { defaultWorkspacePlanRuntimeAdapter } from "./default-runtime-adapter";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("./persistence/workspace-plan-state.repository", () => ({
  getWorkspaceSelectedPlanState: vi.fn(),
}));

vi.mock("../subscription/subscription.service", () => ({
  getTierForTenant: vi.fn(),
}));

const { getWorkspaceSelectedPlanState } = await import("./persistence/workspace-plan-state.repository");
const { getTierForTenant } = await import("../subscription/subscription.service");

describe("defaultWorkspacePlanRuntimeAdapter", () => {
  it("returns canonicalPlanCode from persisted state when present (Step 4 priority)", async () => {
    vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue({
      tenantId: "tenant-0",
      canonicalPlanCode: "business_operations",
      sourceKind: "recommendation_selected",
      selectedByUserId: "user-1",
      selectedAt: "2026-03-19T12:00:00Z",
      addOnCodes: ["extra_users"],
      createdAt: "2026-03-19T12:00:00Z",
      updatedAt: "2026-03-19T12:00:00Z",
    });
    const source = await defaultWorkspacePlanRuntimeAdapter.getRuntimeSource(
      {} as SupabaseClient,
      "tenant-0"
    );
    expect(source.canonicalPlanCode).toBe("business_operations");
    expect(source.addOnCodes).toEqual(["extra_users"]);
    expect(source._meta?.source).toBe("workspace_plan_state");
    expect(source.legacyTier).toBeUndefined();
    expect(getTierForTenant).not.toHaveBeenCalled();
  });

  it("returns legacyTier FREE when getTierForTenant returns FREE", async () => {
    vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(getTierForTenant).mockResolvedValue("FREE");
    const source = await defaultWorkspacePlanRuntimeAdapter.getRuntimeSource(
      {} as SupabaseClient,
      "tenant-1"
    );
    expect(source.workspaceId).toBe("tenant-1");
    expect(source.legacyTier).toBe("FREE");
    expect(source._meta?.source).toBe("entitlements_then_tenants");
  });

  it("returns legacyTier PRO when getTierForTenant returns PRO", async () => {
    vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(getTierForTenant).mockResolvedValue("PRO");
    const source = await defaultWorkspacePlanRuntimeAdapter.getRuntimeSource(
      {} as SupabaseClient,
      "tenant-2"
    );
    expect(source.legacyTier).toBe("PRO");
  });

  it("returns legacyTier ENTERPRISE when getTierForTenant returns ENTERPRISE", async () => {
    vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(getTierForTenant).mockResolvedValue("ENTERPRISE");
    const source = await defaultWorkspacePlanRuntimeAdapter.getRuntimeSource(
      {} as SupabaseClient,
      "tenant-3"
    );
    expect(source.legacyTier).toBe("ENTERPRISE");
  });

  it("returns undefined legacyTier when getTierForTenant returns unknown value", async () => {
    vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(getTierForTenant).mockResolvedValue("CUSTOM" as never);
    const source = await defaultWorkspacePlanRuntimeAdapter.getRuntimeSource(
      {} as SupabaseClient,
      "tenant-4"
    );
    expect(source.legacyTier).toBeUndefined();
  });
});
