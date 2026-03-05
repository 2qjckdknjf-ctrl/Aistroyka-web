import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateUploadSession } from "./upload-session.policy";
import * as repo from "./upload-session.repository";
import type { UploadSession, UploadSessionPurpose } from "./upload-session.types";
import { emitChange } from "@/lib/sync/change-log.repository";

/** Bucket name for media uploads (must exist in Supabase Storage). */
export const UPLOAD_BUCKET = "media";

/** Env: when true, finalize verifies object exists in storage before updating session. Default false. */
function isFinalizeVerifyObjectEnabled(): boolean {
  return process.env.MEDIA_FINALIZE_VERIFY_OBJECT === "true";
}

/** Env: when true and verify is enabled, storage errors block finalize. Default false. */
function isFinalizeVerifyStrictEnabled(): boolean {
  return process.env.MEDIA_FINALIZE_VERIFY_STRICT === "true";
}

/** Path in bucket (strip bucket prefix from object_path). */
function pathInBucket(objectPath: string): string {
  const prefix = `${UPLOAD_BUCKET}/`;
  return objectPath.startsWith(prefix) ? objectPath.slice(prefix.length) : objectPath;
}

/**
 * Best-effort check that the object exists in storage. Returns { exists, error }.
 * On provider/network error, error is set; when strict mode is off, caller may still proceed.
 */
async function verifyStorageObjectExists(
  supabase: SupabaseClient,
  objectPath: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const path = pathInBucket(objectPath);
    const { data: exists, error } = await supabase.storage.from(UPLOAD_BUCKET).exists(path);
    if (error) return { exists: false, error: error.message };
    return { exists: exists === true };
  } catch (e) {
    return { exists: false, error: e instanceof Error ? e.message : String(e) };
  }
}

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

  if (isFinalizeVerifyObjectEnabled()) {
    const { exists, error: verifyError } = await verifyStorageObjectExists(supabase, payload.object_path);
    if (!exists && !verifyError) {
      return { ok: false, error: "media_object_missing" };
    }
    if (verifyError && isFinalizeVerifyStrictEnabled()) {
      return { ok: false, error: "Storage verification unavailable" };
    }
  }

  const ok = await repo.finalize(supabase, sessionId, ctx.tenantId, ctx.userId, payload);
  if (ok) {
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
