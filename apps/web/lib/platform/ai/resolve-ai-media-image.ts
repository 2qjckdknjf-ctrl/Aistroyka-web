/**
 * Unified server-side AI media image resolver.
 * Accepts media_id, upload_session_id, or a safe storage path / our-storage URL.
 * Creates short-lived signed URLs for providers. Never trusts arbitrary external client URLs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import {
  MEDIA_BUCKET,
  extractMediaPathFromStorageUrl,
  isStorageObjectPath,
  pathInMediaBucket,
} from "./media-path";

/** Signed URL lifetime for AI provider fetch (seconds). */
export const AI_MEDIA_SIGNED_URL_TTL_SEC = 900;

export type ResolveAIMediaImageInput = {
  tenantId: string;
  reportId?: string | null;
  mediaId?: string | null;
  uploadSessionId?: string | null;
  /** Legacy payload field: only accepted if our storage URL or storage object path. */
  imageUrl?: string | null;
  projectId?: string | null;
};

export type ResolveAIMediaImageSuccess = {
  ok: true;
  imageUrl: string;
  source: "media" | "upload_session" | "storage_path" | "legacy_storage_url";
  objectPath: string;
};

export type ResolveAIMediaImageFailure = {
  ok: false;
  code: AIErrorCode;
  retryable: boolean;
  /** Safe technical message for job.last_error / admin (no secrets). */
  message: string;
};

export type ResolveAIMediaImageResult =
  ResolveAIMediaImageSuccess | ResolveAIMediaImageFailure;

function fail(
  code: AIErrorCode,
  message: string,
  retryable: boolean,
): ResolveAIMediaImageFailure {
  return { ok: false, code, retryable, message };
}

async function createSignedUrlForPath(
  supabase: SupabaseClient,
  objectPath: string,
): Promise<ResolveAIMediaImageResult> {
  const relative = pathInMediaBucket(objectPath);
  if (!relative || relative.includes("..")) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      "Invalid storage object path",
      false,
    );
  }
  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(relative, AI_MEDIA_SIGNED_URL_TTL_SEC);
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (
        msg.includes("not found") ||
        msg.includes("object not found") ||
        msg.includes("404")
      ) {
        return fail(
          AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING,
          "Storage object missing for media reference",
          false,
        );
      }
      // Network / transient storage errors
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Temporary storage error while signing media URL",
        true,
      );
    }
    const signed = data?.signedUrl;
    if (typeof signed !== "string" || !signed) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Storage did not return a signed URL",
        true,
      );
    }
    return {
      ok: true,
      imageUrl: signed,
      source: "storage_path",
      objectPath: relative,
    };
  } catch {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
      "Temporary storage error while signing media URL",
      true,
    );
  }
}

async function resolveFromMediaId(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string,
  projectId: string | null,
): Promise<ResolveAIMediaImageResult | null> {
  const { data, error } = await supabase
    .from("media")
    .select("id, tenant_id, project_id, file_url")
    .eq("id", mediaId)
    .maybeSingle();

  if (error) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
      "Temporary error loading media row",
      true,
    );
  }
  if (!data) {
    return null; // allow upload_session fallback
  }

  const row = data as {
    id: string;
    tenant_id?: string;
    project_id?: string | null;
    file_url?: string | null;
  };

  if (row.tenant_id && row.tenant_id !== tenantId) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Media tenant mismatch",
      false,
    );
  }
  if (projectId && row.project_id && row.project_id !== projectId) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Media project mismatch",
      false,
    );
  }

  const fileUrl = typeof row.file_url === "string" ? row.file_url.trim() : "";
  if (!fileUrl) {
    // Media row exists but URL not ready — caller may fall back to upload session.
    return fail(
      AI_ERROR_CODES.AI_MEDIA_NOT_READY,
      "Media row pending file_url",
      true,
    );
  }

  let supabaseUrl = "";
  try {
    supabaseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    supabaseUrl = "";
  }

  const fromOurUrl = supabaseUrl
    ? extractMediaPathFromStorageUrl(fileUrl, supabaseUrl)
    : null;
  if (fromOurUrl) {
    const signed = await createSignedUrlForPath(supabase, fromOurUrl);
    if (signed.ok) return { ...signed, source: "media" };
    return signed;
  }

  if (isStorageObjectPath(fileUrl)) {
    const signed = await createSignedUrlForPath(supabase, fileUrl);
    if (signed.ok) return { ...signed, source: "media" };
    return signed;
  }

  // External URL in file_url is not a trusted AI source (do not send to providers).
  return fail(
    AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
    "Media file_url is not a trusted storage reference",
    false,
  );
}

async function resolveFromUploadSession(
  supabase: SupabaseClient,
  uploadSessionId: string,
  tenantId: string,
): Promise<ResolveAIMediaImageResult> {
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("id, tenant_id, status, object_path")
    .eq("id", uploadSessionId)
    .maybeSingle();

  if (error) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
      "Temporary error loading upload session",
      true,
    );
  }
  if (!data) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
      "Upload session not found",
      false,
    );
  }

  const session = data as {
    id: string;
    tenant_id?: string;
    status?: string;
    object_path?: string | null;
  };

  if (session.tenant_id && session.tenant_id !== tenantId) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Upload session tenant mismatch",
      false,
    );
  }

  const status = session.status ?? "";
  if (status === "created" || status === "uploaded") {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_NOT_READY,
      "Upload session not finalized yet",
      true,
    );
  }
  if (status === "expired") {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
      "Upload session expired",
      false,
    );
  }
  if (status !== "finalized") {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      `Unexpected upload session status: ${status || "unknown"}`,
      false,
    );
  }

  const objectPath =
    typeof session.object_path === "string" ? session.object_path.trim() : "";
  if (!objectPath) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      "Finalized upload session missing object_path",
      false,
    );
  }

  // Tenant path guard: object_path must be under media/{tenantId}/{sessionId}
  const expectedPrefix = `${MEDIA_BUCKET}/${tenantId}/${uploadSessionId}`;
  const normalized = objectPath.replace(/^\/+/, "");
  if (
    normalized !== expectedPrefix &&
    !normalized.startsWith(`${expectedPrefix}/`) &&
    // Also allow bucket-relative form without media/ prefix
    normalized !== `${tenantId}/${uploadSessionId}` &&
    !normalized.startsWith(`${tenantId}/${uploadSessionId}/`)
  ) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Upload session object_path outside tenant session prefix",
      false,
    );
  }

  const signed = await createSignedUrlForPath(supabase, objectPath);
  if (signed.ok) return { ...signed, source: "upload_session" };
  return signed;
}

async function resolveFromLegacyImageUrl(
  supabase: SupabaseClient,
  imageUrl: string,
  tenantId: string,
): Promise<ResolveAIMediaImageResult | null> {
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  let supabaseUrl = "";
  try {
    supabaseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    supabaseUrl = "";
  }

  if (isStorageObjectPath(trimmed)) {
    // Require tenant segment when path includes tenant UUID
    const relative = pathInMediaBucket(trimmed);
    if (!relative.startsWith(`${tenantId}/`)) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
        "Storage path tenant mismatch",
        false,
      );
    }
    const signed = await createSignedUrlForPath(supabase, relative);
    if (signed.ok) return { ...signed, source: "storage_path" };
    return signed;
  }

  if (supabaseUrl) {
    const fromUrl = extractMediaPathFromStorageUrl(trimmed, supabaseUrl);
    if (fromUrl) {
      if (!fromUrl.startsWith(`${tenantId}/`)) {
        return fail(
          AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
          "Storage URL tenant mismatch",
          false,
        );
      }
      const signed = await createSignedUrlForPath(supabase, fromUrl);
      if (signed.ok) return { ...signed, source: "legacy_storage_url" };
      return signed;
    }
  }

  // Arbitrary external URL — not trusted
  return fail(
    AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
    "External image_url is not a trusted storage reference",
    false,
  );
}

/**
 * Resolve a short-lived signed image URL for AI vision analysis.
 */
export async function resolveAIMediaImage(
  supabase: SupabaseClient,
  input: ResolveAIMediaImageInput,
): Promise<ResolveAIMediaImageResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "tenant_id required",
      false,
    );
  }

  let projectId = input.projectId?.trim() || null;

  // Verify report belongs to tenant when provided; resolve project for media checks.
  if (input.reportId) {
    const { data: report, error } = await supabase
      .from("worker_reports")
      .select("id, tenant_id, task_id, day_id")
      .eq("id", input.reportId)
      .maybeSingle();
    if (error) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Temporary error loading report",
        true,
      );
    }
    if (!report) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
        "Report not found for AI media job",
        false,
      );
    }
    if ((report as { tenant_id?: string }).tenant_id !== tenantId) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
        "Report tenant mismatch",
        false,
      );
    }
    if (!projectId) {
      const taskId = (report as { task_id?: string | null }).task_id;
      const dayId = (report as { day_id?: string | null }).day_id;
      if (taskId) {
        const { data: task } = await supabase
          .from("worker_tasks")
          .select("project_id")
          .eq("id", taskId)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        projectId =
          (task as { project_id?: string } | null)?.project_id ?? null;
      } else if (dayId) {
        const { data: day } = await supabase
          .from("worker_day")
          .select("project_id")
          .eq("id", dayId)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        projectId = (day as { project_id?: string } | null)?.project_id ?? null;
      }
    }
  }

  const pendingNotReady: ResolveAIMediaImageFailure[] = [];
  const permanentFailures: ResolveAIMediaImageFailure[] = [];

  if (input.mediaId) {
    const mediaResult = await resolveFromMediaId(
      supabase,
      input.mediaId,
      tenantId,
      projectId,
    );
    if (mediaResult?.ok) return mediaResult;
    if (mediaResult) {
      if (
        mediaResult.retryable &&
        mediaResult.code === AI_ERROR_CODES.AI_MEDIA_NOT_READY
      ) {
        pendingNotReady.push(mediaResult);
      } else if (mediaResult.code === AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED) {
        return mediaResult;
      } else if (!mediaResult.retryable) {
        permanentFailures.push(mediaResult);
      } else {
        pendingNotReady.push(mediaResult);
      }
    } else {
      // media row missing — try upload session before declaring not found
      permanentFailures.push(
        fail(
          AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
          "Media record not found",
          false,
        ),
      );
    }
  }

  if (input.uploadSessionId) {
    const sessionResult = await resolveFromUploadSession(
      supabase,
      input.uploadSessionId,
      tenantId,
    );
    if (sessionResult.ok) return sessionResult;
    if (sessionResult.retryable) {
      pendingNotReady.push(sessionResult);
    } else if (sessionResult.code === AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED) {
      return sessionResult;
    } else {
      permanentFailures.push(sessionResult);
    }
  }

  if (input.imageUrl) {
    const legacy = await resolveFromLegacyImageUrl(
      supabase,
      input.imageUrl,
      tenantId,
    );
    if (legacy?.ok) return legacy;
    if (legacy) {
      if (legacy.retryable) pendingNotReady.push(legacy);
      else permanentFailures.push(legacy);
    }
  }

  // Prefer retryable "not ready" over permanent failure when any source is still pending.
  if (pendingNotReady.length > 0) {
    return pendingNotReady[0]!;
  }

  if (permanentFailures.length > 0) {
    // Prefer object-missing / corrupt over generic not-found when we had references.
    const preferred =
      permanentFailures.find(
        (f) => f.code === AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING,
      ) ??
      permanentFailures.find(
        (f) => f.code === AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      ) ??
      permanentFailures[0]!;
    return preferred;
  }

  return fail(
    AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
    "Could not resolve image from media_id or upload_session_id",
    false,
  );
}
