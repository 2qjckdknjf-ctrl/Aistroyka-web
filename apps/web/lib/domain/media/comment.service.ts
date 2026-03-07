/**
 * Comment service - handles photo comments.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getAdminClient } from "@/lib/supabase/admin";
import * as repo from "./comment.repository";
import { emitChange } from "@/lib/sync/change-log.repository";
import type { PhotoComment } from "./comment.repository";

export async function createComment(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string,
  body: string
): Promise<{ data: PhotoComment | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) {
    return { data: null, error: "Unauthorized" };
  }

  if (!body || typeof body !== "string" || !body.trim()) {
    return { data: null, error: "body required" };
  }

  const comment = await repo.createComment(supabase, ctx.tenantId, mediaId, ctx.userId, body.trim());

  if (!comment) {
    return { data: null, error: "Failed to create comment" };
  }

  // Emit change-log event for sync
  const admin = getAdminClient();
  if (admin) {
    await emitChange(admin, {
      tenant_id: ctx.tenantId,
      resource_type: "media",
      resource_id: mediaId,
      change_type: "updated",
      changed_by: ctx.userId,
      payload: { comment_id: comment.id },
    });
  }

  return { data: comment, error: "" };
}

export async function listComments(
  supabase: SupabaseClient,
  ctx: TenantContext,
  mediaId: string
): Promise<{ data: PhotoComment[]; error: string }> {
  if (!ctx.tenantId) {
    return { data: [], error: "Unauthorized" };
  }

  const comments = await repo.listCommentsByMedia(supabase, mediaId, ctx.tenantId);
  return { data: comments, error: "" };
}
