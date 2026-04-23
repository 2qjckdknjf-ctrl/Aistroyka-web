/**
 * Default runtime adapter. Source order (Step 4):
 * 1) Persisted canonical selected plan (workspace_plan_state)
 * 2) Legacy tier bridge (entitlements then tenants.plan)
 * Conflict handling and safe default applied in service layer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspaceSelectedPlanState } from "./persistence/workspace-plan-state.repository";
import { getTierForTenant } from "../subscription/subscription.service";
import type { WorkspacePlanRuntimeAdapter } from "./runtime-adapter.types";
import type { WorkspacePlanRuntimeSource } from "./runtime-source.types";
import type { LegacyTier } from "./bridge.types";

const VALID_LEGACY_TIERS: LegacyTier[] = ["FREE", "PRO", "ENTERPRISE"];

function normalizeToLegacyTier(tier: string): LegacyTier | null {
  const u = tier.toUpperCase();
  if (VALID_LEGACY_TIERS.includes(u as LegacyTier)) return u as LegacyTier;
  return null;
}

/**
 * Default adapter: 1) read workspace_plan_state (persisted canonical plan), 2) else getTierForTenant.
 */
export const defaultWorkspacePlanRuntimeAdapter: WorkspacePlanRuntimeAdapter = {
  async getRuntimeSource(
    supabase: SupabaseClient,
    workspaceId: string
  ): Promise<WorkspacePlanRuntimeSource> {
    const persisted = await getWorkspaceSelectedPlanState(supabase, workspaceId);
    if (persisted) {
      return {
        workspaceId,
        canonicalPlanCode: persisted.canonicalPlanCode,
        addOnCodes: persisted.addOnCodes.length ? persisted.addOnCodes : undefined,
        _meta: { source: "workspace_plan_state" },
      };
    }
    const tier = await getTierForTenant(supabase, workspaceId);
    const legacyTier = tier != null ? normalizeToLegacyTier(tier) : null;
    return {
      workspaceId,
      legacyTier: legacyTier ?? undefined,
      _meta: { source: "entitlements_then_tenants" },
    };
  },
};
