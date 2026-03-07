/**
 * Worker summary service - handles worker statistics.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./worker-summary.repository";
import type { WorkerSummary } from "./worker-summary.repository";

export async function getWorkerSummary(
  supabase: SupabaseClient,
  ctx: TenantContext,
  userId: string
): Promise<{ data: WorkerSummary | null; error: string }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  const summary = await repo.getWorkerSummary(supabase, ctx.tenantId, userId);
  return { data: summary, error: "" };
}
