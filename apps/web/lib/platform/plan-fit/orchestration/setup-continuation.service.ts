/**
 * Setup continuation service (Step 7).
 * Returns workspace setup state for orchestration and UI.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateSetupReadinessV2 } from "./setup-readiness.evaluator";
import type { SetupReadinessV2 } from "./setup-readiness.types";

export interface WorkspaceSetupState {
  readiness: SetupReadinessV2;
  completedSteps: SetupReadinessV2["completedSteps"];
  missingSteps: SetupReadinessV2["missingSteps"];
  nextActionKey: SetupReadinessV2["nextActionKey"];
  targetRoute: string | null;
}

/**
 * Get workspace setup continuation state.
 * Used by orchestration and can be exposed via API for UI.
 */
export async function getWorkspaceSetupState(
  supabase: SupabaseClient,
  tenantId: string
): Promise<WorkspaceSetupState> {
  const readiness = await evaluateSetupReadinessV2(supabase, tenantId);
  return {
    readiness,
    completedSteps: readiness.completedSteps,
    missingSteps: readiness.missingSteps,
    nextActionKey: readiness.nextActionKey,
    targetRoute: readiness.targetRoute,
  };
}
