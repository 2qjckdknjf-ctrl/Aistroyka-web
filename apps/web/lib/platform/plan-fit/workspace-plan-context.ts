/**
 * Build workspace plan context: single entrypoint for app layer.
 * Uses bridge when legacy tier is provided; resolves effective entitlements and capabilities.
 */

import type { PlanCode } from "@aistroyka/contracts";
import { tierToPlanCode } from "./bridge";
import type { LegacyTier } from "./bridge.types";
import { resolveEffectiveWorkspaceEntitlements } from "./resolve";
import type {
  WorkspacePlanContext,
  WorkspacePlanSourceKind,
  ResolveWorkspacePlanContextInput,
} from "./workspace-plan-context.types";

function resolveCanonicalPlanCode(input: ResolveWorkspacePlanContextInput): {
  planCode: PlanCode;
  sourceKind: WorkspacePlanSourceKind;
  sourceLegacyTier?: LegacyTier;
} {
  if (input.planCode != null) {
    return { planCode: input.planCode, sourceKind: "canonical_plan" };
  }
  if (input.legacyTier != null) {
    return {
      planCode: tierToPlanCode(input.legacyTier),
      sourceKind: "legacy_tier_bridge",
      sourceLegacyTier: input.legacyTier,
    };
  }
  return {
    planCode: "client_personal",
    sourceKind: "canonical_plan",
  };
}

/**
 * Resolve workspace plan context: canonical plan, effective entitlements, capabilities.
 * Pass either planCode (canonical) or legacyTier (mapped via bridge). No DB reads.
 */
export function resolveWorkspacePlanContext(
  input: ResolveWorkspacePlanContextInput
): WorkspacePlanContext {
  const { planCode, sourceKind, sourceLegacyTier } = resolveCanonicalPlanCode(input);
  const addOnCodes = input.addOnCodes ?? [];

  const resolved = resolveEffectiveWorkspaceEntitlements({
    planCode,
    addOnCodes,
    usage: input.usageSnapshot,
    overrides: input.overrides,
  });

  const notes: string[] = [...resolved.warnings];
  if (sourceKind === "legacy_tier_bridge") {
    notes.push(`Plan derived from legacy tier ${sourceLegacyTier} (transitional bridge).`);
  }

  return {
    workspaceId: input.workspaceId,
    canonicalPlanCode: planCode,
    sourceKind,
    sourceLegacyTier,
    addOnCodes,
    effectiveEntitlements: {
      limits: resolved.effectiveLimits,
      capabilities: resolved.effectiveCapabilities,
    },
    effectiveCapabilities: resolved.effectiveCapabilities,
    usageSnapshot: input.usageSnapshot,
    trialEndsAt: input.trialEndsAt ?? undefined,
    notes: notes.length > 0 ? notes : undefined,
  };
}

/** Alias for resolveWorkspacePlanContext. */
export const getWorkspacePlanContext = resolveWorkspacePlanContext;

/** Alias for building from already-resolved data (e.g. from cache). */
export const buildWorkspacePlanContext = resolveWorkspacePlanContext;
