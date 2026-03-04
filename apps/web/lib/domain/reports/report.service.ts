import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateReport } from "./report.policy";
import * as repo from "./report.repository";
import type { Report } from "./report.types";

export async function createReport(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: Report | null; error: string }> {
  if (!canCreateReport(ctx)) return { data: null, error: "Insufficient rights" };
  const data = await repo.create(supabase, ctx.tenantId, ctx.userId);
  if (!data) return { data: null, error: "Failed to create report" };
  return { data, error: "" };
}
