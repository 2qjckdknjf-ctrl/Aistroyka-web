/**
 * Adapter contract: read runtime plan data and return normalized source.
 * Implementations must not leak legacy tier logic outward; normalization only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspacePlanRuntimeSource } from "./runtime-source.types";

export interface WorkspacePlanRuntimeAdapter {
  /**
   * Load plan-related data for the workspace from current runtime (DB, etc.).
   * Returns normalized source; missing data => omit fields or use null.
   */
  getRuntimeSource(
    supabase: SupabaseClient,
    workspaceId: string
  ): Promise<WorkspacePlanRuntimeSource>;
}
