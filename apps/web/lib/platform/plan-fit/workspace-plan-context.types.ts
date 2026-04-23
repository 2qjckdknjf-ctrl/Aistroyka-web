/**
 * Application-level workspace plan context for gating, onboarding, upgrade prompts.
 */

import type { AddOnCode, PlanCode } from "@aistroyka/contracts";
import type { PlanEntitlement } from "./entitlements.types";
import type { UsageSnapshot } from "./capability.types";
import type { LegacyTier } from "./bridge.types";

export type WorkspacePlanSourceKind =
  | "canonical_plan"
  | "legacy_tier_bridge"
  | "override";

export interface WorkspacePlanContext {
  workspaceId: string;
  canonicalPlanCode: PlanCode;
  sourceKind: WorkspacePlanSourceKind;
  sourceLegacyTier?: LegacyTier;
  addOnCodes: AddOnCode[];
  effectiveEntitlements: PlanEntitlement;
  effectiveCapabilities: PlanEntitlement["capabilities"];
  usageSnapshot?: UsageSnapshot;
  trialEndsAt?: string | null;
  notes?: string[];
}

export interface ResolveWorkspacePlanContextInput {
  workspaceId: string;
  /** When source is canonical: pass planCode. When source is legacy: pass legacyTier (bridge will map). */
  planCode?: PlanCode;
  legacyTier?: LegacyTier;
  addOnCodes?: AddOnCode[];
  usageSnapshot?: UsageSnapshot;
  trialEndsAt?: string | null;
  /** Optional overrides applied last in resolution. */
  overrides?: {
    limits?: Partial<PlanEntitlement["limits"]>;
    capabilities?: Partial<PlanEntitlement["capabilities"]>;
  };
}
