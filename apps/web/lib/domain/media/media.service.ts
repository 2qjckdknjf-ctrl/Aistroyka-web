import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects } from "./media.policy";
import * as repo from "./media.repository";
import type { Media } from "./media.types";

export async function listMediaForProject(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: Media[]; error: string | null }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  const data = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data, error: null };
}

export async function getMedia(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string
): Promise<{ data: Media | null; error: string | null }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  const data = await repo.getById(supabase, mediaId, ctx.tenantId);
  return { data, error: null };
}
