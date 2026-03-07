/**
 * Media collaboration service - handles annotations and comments for media.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import * as repo from "./media-collab.repository";
import type { MediaCollabData } from "./media-collab.repository";

export async function getMediaCollab(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string
): Promise<{ data: MediaCollabData | null; error: string }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  const collab = await repo.getMediaCollab(supabase, mediaId, ctx.tenantId);
  return { data: collab, error: "" };
}
