/**
 * Use case: getExecutiveSummary(projectId) and portfolio direction.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getExecutiveSummary } from "@/lib/ai-brain/services";

export async function getExecutiveSummaryForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
) {
  return getExecutiveSummary(supabase, projectId, tenantId);
}
