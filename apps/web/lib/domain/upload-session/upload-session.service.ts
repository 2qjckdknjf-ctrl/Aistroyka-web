import type { SupabaseClient } from "@supabase/supabase-js";
import { logStructured } from "@/lib/observability";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateUploadSession } from "./upload-session.policy";
import * as repo from "./upload-session.repository";
import type { UploadSession, UploadSessionPurpose } from "./upload-session.types";
import { emitChange } from "@/lib/sync/change-log.repository";
import { getAdminClient } from "@/lib/supabase/admin";

/** Bucket name for media uploads (must exist in Supabase Storage). */
export const UPLOAD_BUCKET = "media";


/**
 * Best-effort check that the object exists in storage (list parent folder for name).
 * Returns false on error or if object not found.
 */
async function storageObjectExists(
  supabase: SupabaseClient,
  bucket: string,
  objectPath: string
): Promise<boolean> {
  const pathInBucket = objectPath.startsWith(`${bucket}/`) ? objectPath.slice(bucket.length + 1) : objectPath;
  const hasSlash = pathInBucket.includes("/");
  const folderPath = hasSlash ? pathInBucket.split("/").slice(0, -1).join("/") : "";
  const segmentName = hasSlash ? pathInBucket.split("/").pop()! : pathInBucket;
  const { data, error } = await supabase.storage.from(bucket).list(folderPath, { limit: 1000 });
  if (error) return false;
  const items = (data ?? []) as { name: string }[];
  return items.some((item) => item.name === segmentName);
}

export async function createUploadSession(
  supabase: SupabaseClient,
  ctx: TenantContext,
  purpose: UploadSessionPurpose
): Promise<{ data: UploadSession & { upload_path: string } | null; error: string }> {
  if (!canCreateUploadSession(ctx)) return { data: null, error: "Insufficient rights" };
  const session = await repo.create(supabase, ctx.tenantId, ctx.userId, purpose);
  if (!session) return { data: null, error: "Failed to create session" };
  logStructured({
    event: "upload_session_created",
    session_id: session.id,
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    purpose,
  });
  await emitChange(supabase, {
    tenant_id: ctx.tenantId,
    resource_type: "media",
    resource_id: session.id,
    change_type: "created",
    changed_by: ctx.userId,
    payload: { status: "created", purpose },
  });
  const upload_path = `${UPLOAD_BUCKET}/${ctx.tenantId}/${session.id}`;
  return { data: { ...session, upload_path }, error: "" };
}

/** Expected storage prefix for this session (tenant-scoped). */
export function expectedObjectPathPrefix(tenantId: string, sessionId: string): string {
  return `${UPLOAD_BUCKET}/${tenantId}/${sessionId}`;
}

function isObjectPathAllowed(objectPath: string, tenantId: string, sessionId: string): boolean {
  if (objectPath.includes("..")) return false;
  const prefix = expectedObjectPathPrefix(tenantId, sessionId);
  return objectPath === prefix || objectPath.startsWith(prefix + "/");
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
  if (!isObjectPathAllowed(payload.object_path, ctx.tenantId, sessionId)) {
    return { ok: false, error: "object_path must be within session path" };
  }

  const verifyObject = process.env.MEDIA_FINALIZE_VERIFY_OBJECT === "true";
  const verifyStrict = process.env.MEDIA_FINALIZE_VERIFY_STRICT === "true";
  if (verifyObject) {
    try {
      const admin = getAdminClient();
      if (admin) {
        const exists = await storageObjectExists(admin, UPLOAD_BUCKET, payload.object_path);
        if (!exists) return { ok: false, error: "media_object_missing" };
      }
    } catch {
      if (verifyStrict) return { ok: false, error: "storage_verification_failed" };
      // best-effort: proceed with finalize when strict is off
    }
  }

  const ok = await repo.finalize(supabase, sessionId, ctx.tenantId, ctx.userId, payload);
  if (ok) {
    logStructured({
      event: "upload_session_finalized",
      session_id: sessionId,
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
    });
    await emitChange(supabase, {
      tenant_id: ctx.tenantId,
      resource_type: "media",
      resource_id: sessionId,
      change_type: "updated",
      changed_by: ctx.userId,
      payload: { status: "finalized" },
    });
  }
  return { ok, error: ok ? "" : "Failed to finalize or session expired" };
}
