import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canCreateUploadSession } from "./upload-session.policy";
import * as repo from "./upload-session.repository";
import type { UploadSession, UploadSessionPurpose } from "./upload-session.types";
import { emitChange } from "@/lib/sync/change-log.repository";

/** Bucket name for media uploads (must exist in Supabase Storage). */
export const UPLOAD_BUCKET = "media";

/** Env: when true, finalize verifies object exists in storage before updating session. Default false. */
function getMediaFinalizeVerifyObject(): boolean {
  return process.env.MEDIA_FINALIZE_VERIFY_OBJECT === "true";
}
/** Env: when true and verify is on, storage provider errors block finalize (503). Default false. */
function getMediaFinalizeVerifyStrict(): boolean {
  return process.env.MEDIA_FINALIZE_VERIFY_STRICT === "true";
}

export type FinalizeResult =
  | { ok: true; error: "" }
  | { ok: false; error: string; code?: "media_object_missing" | "storage_unavailable" };

/** Best-effort check: does the object exist in storage? Returns { exists } or { exists: false, verifyError } on provider/network error. */
export async function verifyStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  objectPath: string
): Promise<{ exists: boolean; verifyError?: string }> {
  const pathInBucket = objectPath.startsWith(`${bucket}/`)
    ? objectPath.slice(bucket.length + 1)
    : objectPath;
  const parts = pathInBucket.split("/").filter(Boolean);
  if (parts.length === 0) return { exists: false };
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  const name = parts[parts.length - 1]!;
  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    if (error) return { exists: false, verifyError: error.message };
    const found = (data ?? []).some((f: { name: string }) => f.name === name);
    return { exists: found };
  } catch (e) {
    return {
      exists: false,
      verifyError: e instanceof Error ? e.message : String(e),
    };
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
): Promise<FinalizeResult> {
  if (!canCreateUploadSession(ctx)) return { ok: false, error: "Insufficient rights" };
  const session = await repo.getById(supabase, sessionId, ctx.tenantId);
  if (!session) return { ok: false, error: "Session not found" };
  if (session.user_id !== ctx.userId) return { ok: false, error: "Not your session" };
  if (!isObjectPathAllowed(payload.object_path, ctx.tenantId, sessionId)) {
    return { ok: false, error: "object_path must be within session path" };
  }

  if (getMediaFinalizeVerifyObject()) {
    const verify = await verifyStorageObject(
      supabase,
      UPLOAD_BUCKET,
      payload.object_path
    );
    if (!verify.exists && !verify.verifyError) {
      return {
        ok: false,
        error: "Object not found in storage",
        code: "media_object_missing",
      };
    }
    if (verify.verifyError && getMediaFinalizeVerifyStrict()) {
      return {
        ok: false,
        error: "Storage verification failed",
        code: "storage_unavailable",
      };
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
