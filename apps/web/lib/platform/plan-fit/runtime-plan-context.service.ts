/**
 * Runtime service: load WorkspacePlanContext from current app data via adapter.
 * Fallback order: 1) explicit canonical plan, 2) legacy tier bridge, 3) safe default (client_personal).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import { resolveWorkspacePlanContext } from "./workspace-plan-context";
import type { ResolveWorkspacePlanContextInput } from "./workspace-plan-context.types";
import type { WorkspacePlanContext } from "./workspace-plan-context.types";
import type { WorkspacePlanRuntimeAdapter } from "./runtime-adapter.types";
import type { WorkspacePlanRuntimeSource } from "./runtime-source.types";
import { defaultWorkspacePlanRuntimeAdapter } from "./default-runtime-adapter";
import type { LegacyTier } from "./bridge.types";
import type { RuntimePlanWarning } from "./runtime-errors.types";
import { ADD_ON_CODES } from "./add-ons";
import type { AddOnCode } from "@aistroyka/contracts";

const SAFE_DEFAULT_PLAN: PlanCode = "client_personal";

const VALID_LEGACY_TIERS: LegacyTier[] = ["FREE", "PRO", "ENTERPRISE"];

function isValidLegacyTier(tier: string): tier is LegacyTier {
  return VALID_LEGACY_TIERS.includes(tier as LegacyTier);
}

function isValidAddOnCode(code: string): code is AddOnCode {
  return ADD_ON_CODES.includes(code as AddOnCode);
}

/**
 * Normalize runtime source into resolver input and collect warnings.
 */
function toResolverInput(
  source: WorkspacePlanRuntimeSource
): { input: ResolveWorkspacePlanContextInput; warnings: RuntimePlanWarning[] } {
  const warnings: RuntimePlanWarning[] = [];
  let planCode: PlanCode | undefined;
  let legacyTier: LegacyTier | undefined;
  const addOnCodes: AddOnCode[] = [];

  if (source.canonicalPlanCode) {
    planCode = source.canonicalPlanCode;
    if (source.legacyTier && isValidLegacyTier(source.legacyTier)) {
      warnings.push({
        code: "inconsistent_runtime_plan_data",
        message: "Both canonical plan and legacy tier set; using canonical plan.",
      });
    }
  } else if (source.legacyTier && isValidLegacyTier(source.legacyTier)) {
    legacyTier = source.legacyTier;
  } else {
    warnings.push({
      code: "workspace_plan_source_missing",
      message: "No plan or tier in runtime; using safe default (client_personal).",
    });
  }

  if (source.addOnCodes?.length) {
    for (const code of source.addOnCodes) {
      if (isValidAddOnCode(code)) addOnCodes.push(code);
      else warnings.push({ code: "invalid_add_on_code", message: `Unknown add-on code: ${code}` });
    }
  }

  const input: ResolveWorkspacePlanContextInput = {
    workspaceId: source.workspaceId,
    planCode,
    legacyTier,
    addOnCodes: addOnCodes.length ? addOnCodes : undefined,
    usageSnapshot: source.usageSnapshot ?? undefined,
    trialEndsAt: source.trialEndsAt ?? undefined,
    overrides: source.overrides ?? undefined,
  };
  return { input, warnings };
}

export interface GetWorkspacePlanContextFromRuntimeOptions {
  adapter?: WorkspacePlanRuntimeAdapter;
  /** If true, attach meta (warnings, usedFallback) to context.notes. */
  includeMetaInNotes?: boolean;
}

/**
 * Load WorkspacePlanContext from runtime via adapter.
 * Fallback order: 1) canonical plan from source, 2) legacy tier → bridge, 3) client_personal.
 */
export async function getWorkspacePlanContextFromRuntime(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: GetWorkspacePlanContextFromRuntimeOptions
): Promise<WorkspacePlanContext> {
  const adapter = options?.adapter ?? defaultWorkspacePlanRuntimeAdapter;
  const includeMetaInNotes = options?.includeMetaInNotes ?? false;

  const source = await adapter.getRuntimeSource(supabase, workspaceId);
  const { input, warnings } = toResolverInput(source);

  const usedFallback = !input.planCode && !input.legacyTier;
  if (usedFallback) {
    input.planCode = SAFE_DEFAULT_PLAN;
  }

  const context = resolveWorkspacePlanContext(input);

  if (includeMetaInNotes && (warnings.length > 0 || usedFallback)) {
    const metaNotes = [
      ...(context.notes ?? []),
      ...warnings.map((w) => `[${w.code}] ${w.message}`),
      ...(usedFallback ? ["[used_fallback] Safe default plan applied."] : []),
    ];
    context.notes = metaNotes;
  }

  return context;
}

/** Alias for server-side use. */
export const resolveRuntimeWorkspacePlanContext = getWorkspacePlanContextFromRuntime;
