/**
 * Unified server-side AI media image resolver.
 * Accepts media_id, upload_session_id, or a safe storage path / our-storage URL.
 * Creates short-lived signed URLs for providers. Never trusts arbitrary external client URLs.
 *
 * Security: every createSignedUrl call goes through createSignedUrlForPath(tenantId, …),
 * which re-validates tenant (and optional project) object-path scope.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import { MEDIA_BUCKET } from "./media-bucket.constants";
import { isStorageObjectPath } from "./media-path";
import {
  assertMediaPathTenantScope,
  extractAndNormalizeStorageUrlPath,
  normalizeMediaObjectPath,
} from "./media-path-tenant-guard";

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
  /** Safe technical message for job.last_error / admin (no secrets / foreign paths). */
  message: string;
};

export type ResolveAIMediaImageResult = ResolveAIMediaImageSuccess | ResolveAIMediaImageFailure;

function fail(
  code: AIErrorCode,
  message: string,
  retryable: boolean
): ResolveAIMediaImageFailure {
  return { ok: false, code, retryable, message };
}

/**
 * Single chokepoint for Storage signing.
 * Defense-in-depth: always re-checks tenant/project path scope before createSignedUrl.
 */
export async function createSignedUrlForPath(
  supabase: SupabaseClient,
  objectPath: string,
  options: { tenantId: string; projectId?: string | null }
): Promise<ResolveAIMediaImageResult> {
  const scope = assertMediaPathTenantScope(
    objectPath,
    options.tenantId,
    options.projectId ?? null
  );
  if (!scope.ok) {
    return fail(scope.code, scope.reason, false);
  }

  const relative = scope.bucketRelativePath;
  try {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(relative, AI_MEDIA_SIGNED_URL_TTL_SEC);
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("not found") || msg.includes("object not found") || msg.includes("404")) {
        return fail(
          AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING,
          "Storage object missing for media reference",
          false
        );
      }
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Temporary storage error while signing media URL",
        true
      );
    }
    const signed = data?.signedUrl;
    if (typeof signed !== "string" || !signed) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Storage did not return a signed URL",
        true
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
      true
    );
  }
}

function resolvePathFromFileUrlOrPath(
  fileUrl: string,
  supabaseUrl: string
): ResolveAIMediaImageFailure | { ok: true; path: string } {
  const fromUrl = supabaseUrl ? extractAndNormalizeStorageUrlPath(fileUrl, supabaseUrl) : null;
  if (fromUrl) {
    if (!fromUrl.ok) return fail(fromUrl.code, fromUrl.reason, false);
    return { ok: true, path: fromUrl.bucketRelativePath };
  }

  if (isStorageObjectPath(fileUrl) || !/^https?:\/\//i.test(fileUrl.trim())) {
    const normalized = normalizeMediaObjectPath(fileUrl);
    if (!normalized.ok) return fail(normalized.code, normalized.reason, false);
    return { ok: true, path: normalized.bucketRelativePath };
  }

  // http(s) URL that is not our storage origin
  return fail(
    AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
    "Not a trusted storage reference",
    false
  );
}

async function resolveFromMediaId(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string,
  projectId: string | null
): Promise<ResolveAIMediaImageResult | null> {
  const { data, error } = await supabase
    .from("media")
    .select("id, tenant_id, project_id, file_url")
    .eq("id", mediaId)
    .maybeSingle();

  if (error) {
    return fail(AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY, "Temporary error loading media row", true);
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
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Media tenant mismatch", false);
  }
  if (projectId && row.project_id && row.project_id !== projectId) {
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Media project mismatch", false);
  }

  const fileUrl = typeof row.file_url === "string" ? row.file_url.trim() : "";
  if (!fileUrl) {
    return fail(AI_ERROR_CODES.AI_MEDIA_NOT_READY, "Media row pending file_url", true);
  }

  let supabaseUrl = "";
  try {
    supabaseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    supabaseUrl = "";
  }

  const extracted = resolvePathFromFileUrlOrPath(fileUrl, supabaseUrl);
  if (!extracted.ok) {
    if (extracted.message === "Not a trusted storage reference") {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
        "Media file_url is not a trusted storage reference",
        false
      );
    }
    return extracted;
  }

  // Physical path must belong to this tenant (or the media row's project prefix).
  const allowedProjectId = projectId ?? row.project_id ?? null;
  const signed = await createSignedUrlForPath(supabase, extracted.path, {
    tenantId,
    projectId: allowedProjectId,
  });
  if (signed.ok) return { ...signed, source: "media" };
  return signed;
}

async function resolveFromUploadSession(
  supabase: SupabaseClient,
  uploadSessionId: string,
  tenantId: string
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
      true
    );
  }
  if (!data) {
    return fail(AI_ERROR_CODES.AI_MEDIA_NOT_FOUND, "Upload session not found", false);
  }

  const session = data as {
    id: string;
    tenant_id?: string;
    status?: string;
    object_path?: string | null;
  };

  if (session.tenant_id && session.tenant_id !== tenantId) {
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Upload session tenant mismatch", false);
  }

  const status = session.status ?? "";
  if (status === "created" || status === "uploaded") {
    return fail(AI_ERROR_CODES.AI_MEDIA_NOT_READY, "Upload session not finalized yet", true);
  }
  if (status === "expired") {
    return fail(AI_ERROR_CODES.AI_MEDIA_NOT_FOUND, "Upload session expired", false);
  }
  if (status !== "finalized") {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      `Unexpected upload session status: ${status || "unknown"}`,
      false
    );
  }

  const objectPath = typeof session.object_path === "string" ? session.object_path.trim() : "";
  if (!objectPath) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      "Finalized upload session missing object_path",
      false
    );
  }

  // Session-specific prefix check (caller-level), then central tenant sign guard.
  const normalized = normalizeMediaObjectPath(objectPath);
  if (!normalized.ok) {
    return fail(normalized.code, normalized.reason, false);
  }
  const expectedSessionPrefix = `${tenantId}/${uploadSessionId}`;
  const rel = normalized.bucketRelativePath;
  if (rel !== expectedSessionPrefix && !rel.startsWith(`${expectedSessionPrefix}/`)) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Upload session object_path outside tenant session prefix",
      false
    );
  }

  const signed = await createSignedUrlForPath(supabase, rel, { tenantId, projectId: null });
  if (signed.ok) return { ...signed, source: "upload_session" };
  return signed;
}

async function resolveFromLegacyImageUrl(
  supabase: SupabaseClient,
  imageUrl: string,
  tenantId: string,
  projectId: string | null
): Promise<ResolveAIMediaImageResult | null> {
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  let supabaseUrl = "";
  try {
    supabaseUrl = getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "";
  } catch {
    supabaseUrl = "";
  }

  const extracted = resolvePathFromFileUrlOrPath(trimmed, supabaseUrl);
  if (!extracted.ok) {
    if (extracted.message === "Not a trusted storage reference") {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
        "External image_url is not a trusted storage reference",
        false
      );
    }
    return extracted;
  }

  const signed = await createSignedUrlForPath(supabase, extracted.path, {
    tenantId,
    projectId,
  });
  if (signed.ok) {
    const source = /^https?:\/\//i.test(trimmed) ? "legacy_storage_url" : "storage_path";
    return { ...signed, source };
  }
  return signed;
}

/**
 * Resolve a short-lived signed image URL for AI vision analysis.
 */
export async function resolveAIMediaImage(
  supabase: SupabaseClient,
  input: ResolveAIMediaImageInput
): Promise<ResolveAIMediaImageResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "tenant_id required", false);
  }

  let projectId = input.projectId?.trim() || null;

  if (input.reportId) {
    const { data: report, error } = await supabase
      .from("worker_reports")
      .select("id, tenant_id, task_id, day_id")
      .eq("id", input.reportId)
      .maybeSingle();
    if (error) {
      return fail(AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY, "Temporary error loading report", true);
    }
    if (!report) {
      return fail(AI_ERROR_CODES.AI_MEDIA_NOT_FOUND, "Report not found for AI media job", false);
    }
    if ((report as { tenant_id?: string }).tenant_id !== tenantId) {
      return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Report tenant mismatch", false);
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
        projectId = (task as { project_id?: string } | null)?.project_id ?? null;
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
    const mediaResult = await resolveFromMediaId(supabase, input.mediaId, tenantId, projectId);
    if (mediaResult?.ok) return mediaResult;
    if (mediaResult) {
      if (mediaResult.retryable && mediaResult.code === AI_ERROR_CODES.AI_MEDIA_NOT_READY) {
        pendingNotReady.push(mediaResult);
      } else if (mediaResult.code === AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED) {
        return mediaResult;
      } else if (!mediaResult.retryable) {
        permanentFailures.push(mediaResult);
      } else {
        pendingNotReady.push(mediaResult);
      }
    } else {
      permanentFailures.push(
        fail(AI_ERROR_CODES.AI_MEDIA_NOT_FOUND, "Media record not found", false)
      );
    }
  }

  if (input.uploadSessionId) {
    const sessionResult = await resolveFromUploadSession(supabase, input.uploadSessionId, tenantId);
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
    const legacy = await resolveFromLegacyImageUrl(supabase, input.imageUrl, tenantId, projectId);
    if (legacy?.ok) return legacy;
    if (legacy) {
      if (legacy.retryable) pendingNotReady.push(legacy);
      else permanentFailures.push(legacy);
    }
  }

  if (pendingNotReady.length > 0) {
    return pendingNotReady[0]!;
  }

  if (permanentFailures.length > 0) {
    const preferred =
      permanentFailures.find((f) => f.code === AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING) ??
      permanentFailures.find((f) => f.code === AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE) ??
      permanentFailures[0]!;
    return preferred;
  }

  return fail(
    AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
    "Could not resolve image from media_id or upload_session_id",
    false
  );
}
