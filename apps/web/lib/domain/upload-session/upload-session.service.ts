import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateUploadSession } from "./upload-session.policy";
import * as repo from "./upload-session.repository";
import type { UploadSession, UploadSessionPurpose } from "./upload-session.types";
import { emitChange } from "@/lib/sync/change-log.repository";

/** Bucket name for media uploads (must exist in Supabase Storage). */
export const UPLOAD_BUCKET = "media";

export async function createUploadSession(
  supabase: SupabaseClient,
  ctx: TenantContext,
  purpose: UploadSessionPurpose
): Promise<{ data: UploadSession & { upload_path: string } | null; error: string }> {
  if (!canCreateUploadSession(ctx)) return { data: null, error: "Insufficient rights" };
  const session = await repo.create(supabase, ctx.tenantId, ctx.userId, purpose);
  if (!session) return { data: null, error: "Failed to create session" };
  await emitChange(supabase, {
    tenant_id: ctx.tenantId,
    resource_type: "upload_session",
    resource_id: session.id,
    change_type: "created",
    changed_by: ctx.userId,
    payload: { status: "created", purpose },
  });
  const upload_path = `${UPLOAD_BUCKET}/${ctx.tenantId}/${session.id}`;
  return { data: { ...session, upload_path }, error: "" };
}

export async function finalizeUploadSession(
  supabase: SupabaseClient,
  ctx: TenantContext,
  sessionId: string,
  payload: { object_path: string; mime_type?: string; size_bytes?: number }
): Promise<{ ok: boolean; error: string }> {
  if (!canCreateUploadSession(ctx)) return { ok: false, error: "Insufficient rights" };
  const session = await repo.getById(supabase, sessionId, ctx.tenantId);
  if (!session) return { ok: false, error: "Session not found" };
  if (session.user_id !== ctx.userId) return { ok: false, error: "Not your session" };
  const ok = await repo.finalize(supabase, sessionId, ctx.tenantId, ctx.userId, payload);
  if (ok) {
    await emitChange(supabase, {
      tenant_id: ctx.tenantId,
      resource_type: "upload_session",
      resource_id: sessionId,
      change_type: "updated",
      changed_by: ctx.userId,
      payload: { status: "finalized" },
    });
  }
  return { ok, error: ok ? "" : "Failed to finalize or session expired" };
}
