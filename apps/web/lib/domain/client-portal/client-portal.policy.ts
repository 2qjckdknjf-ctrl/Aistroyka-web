import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";

/**
 * Tenant owner/admin or project manager may change client portal settings.
 */
export async function canManageClientPortalSettings(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<boolean> {
  if (!ctx.tenantId || !ctx.userId) return false;
  if (!canManageProjects(ctx)) return false;
  if (ctx.role === "owner" || ctx.role === "admin") return true;
  const m = await getMembership(supabase, ctx.tenantId, projectId, ctx.userId);
  return m?.role === "manager";
}
