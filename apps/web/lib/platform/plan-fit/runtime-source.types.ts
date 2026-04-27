/**
 * Runtime source model: normalized input from current app data for WorkspacePlanContext.
 * Aligned with what the project actually has (tenant/entitlements/tier); no extra fields.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import type { UsageSnapshot } from "./capability.types";
import type { LegacyTier } from "./bridge.types";

export interface WorkspacePlanRuntimeSource {
  workspaceId: string;
  /** From entitlements table or tenants.plan (legacy). */
  legacyTier?: LegacyTier | null;
  /** When runtime stores canonical plan (future); not in DB today. */
  canonicalPlanCode?: PlanCode | null;
  /** When runtime stores add-ons (future); not in DB today. */
  addOnCodes?: AddOnCode[] | null;
  /** When available (e.g. aggregated usage). */
  usageSnapshot?: UsageSnapshot | null;
  trialEndsAt?: string | null;
  overrides?: {
    limits?: Partial<{ maxUsers: number; maxProjects: number; maxStorageGb: number; maxActiveMobileWorkers: number; maxMonthlyAiRequests: number }>;
    capabilities?: Record<string, boolean>;
  } | null;
  /** For debugging / conflict detection. */
  _meta?: {
    source?: "workspace_plan_state" | "entitlements_then_tenants";
    conflict?: "canonical_and_legacy_both_set";
  };
}
