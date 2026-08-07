/**
 * Unified server-side AI media image resolver.
 * Accepts media_id, upload_session_id, or a safe storage path / our-storage URL.
 * Creates short-lived signed URLs for providers. Never trusts arbitrary external client URLs.
 *
 * Security:
 * - Every createSignedUrl call goes through createSignedUrlForPath({ tenantId }).
 * - Tenant-prefixed paths are authorized sync.
 * - Project-prefixed legacy paths require DB proof:
 *   projects.id = firstPathSegment AND projects.tenant_id = tenantId
 * - input.projectId / payload.project_id is an untrusted claim only (mismatch detection).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import { MEDIA_BUCKET } from "./media-bucket.constants";
import { isStorageObjectPath } from "./media-path";
import {
  extractAndNormalizeStorageUrlPath,
  inspectMediaPathScope,
  isUuid,
  normalizeMediaObjectPath,
} from "./media-path-tenant-guard";
import { verifyProjectBelongsToTenant } from "./verify-project-tenant";

/** Signed URL lifetime for AI provider fetch (seconds). */
export const AI_MEDIA_SIGNED_URL_TTL_SEC = 900;

export type ResolveAIMediaImageInput = {
  tenantId: string;
  reportId?: string | null;
  mediaId?: string | null;
  uploadSessionId?: string | null;
  /** Legacy payload field: only accepted if our storage URL or storage object path. */
  imageUrl?: string | null;
  /**
   * Untrusted claim from job payload (or callers).
   * Never used as authorization. Compared against server-derived trusted project.
   */
  projectIdClaim?: string | null;
};

export type ResolveAIMediaImageSuccess = {
  ok: true;
  imageUrl: string;
  source: "media" | "upload_session" | "storage_path" | "legacy_storage_url";
  objectPath: string;
  /** Server-proven project id when available; never a raw payload claim. */
  trustedProjectId: string | null;
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
 * Callers cannot authorize a foreign project by passing a UUID string —
 * project-prefixed paths are proven against `projects` inside this function.
 */
export async function createSignedUrlForPath(
  supabase: SupabaseClient,
  objectPath: string,
  options: { tenantId: string }
): Promise<ResolveAIMediaImageResult> {
  const inspection = inspectMediaPathScope(objectPath, options.tenantId);

  let relative: string;
  let trustedProjectId: string | null = null;

  switch (inspection.kind) {
    case "tenant_prefixed":
      relative = inspection.bucketRelativePath;
      break;
    case "project_prefix_candidate": {
      const proof = await verifyProjectBelongsToTenant(
        supabase,
        inspection.projectIdCandidate,
        options.tenantId
      );
      if (!proof.ok) {
        return fail(proof.code, proof.reason, proof.retryable);
      }
      relative = inspection.bucketRelativePath;
      trustedProjectId = proof.projectId;
      break;
    }
    case "denied":
      return fail(inspection.code, inspection.reason, false);
    default: {
      const _exhaustive: never = inspection;
      return _exhaustive;
    }
  }

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
      trustedProjectId,
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

  return fail(
    AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
    "Not a trusted storage reference",
    false
  );
}

async function deriveTrustedProjectFromReport(
  supabase: SupabaseClient,
  reportId: string,
  tenantId: string
): Promise<
  | { ok: true; projectId: string | null }
  | ResolveAIMediaImageFailure
> {
  const { data: report, error } = await supabase
    .from("worker_reports")
    .select("id, tenant_id, task_id, day_id")
    .eq("id", reportId)
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

  const taskId = (report as { task_id?: string | null }).task_id;
  const dayId = (report as { day_id?: string | null }).day_id;
  let candidate: string | null = null;

  if (taskId) {
    const { data: task, error: taskErr } = await supabase
      .from("worker_tasks")
      .select("project_id")
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (taskErr) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Temporary error loading task for report",
        true
      );
    }
    candidate = (task as { project_id?: string } | null)?.project_id ?? null;
  } else if (dayId) {
    const { data: day, error: dayErr } = await supabase
      .from("worker_day")
      .select("project_id")
      .eq("id", dayId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (dayErr) {
      return fail(
        AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY,
        "Temporary error loading worker day for report",
        true
      );
    }
    candidate = (day as { project_id?: string } | null)?.project_id ?? null;
  }

  if (!candidate) {
    return { ok: true, projectId: null };
  }

  const proof = await verifyProjectBelongsToTenant(supabase, candidate, tenantId);
  if (!proof.ok) {
    return fail(proof.code, proof.reason, proof.retryable);
  }
  return { ok: true, projectId: proof.projectId };
}

async function resolveClaimAgainstTrusted(
  supabase: SupabaseClient,
  claim: string | null,
  trustedProjectId: string | null,
  tenantId: string
): Promise<ResolveAIMediaImageFailure | { ok: true; trustedProjectId: string | null }> {
  if (!claim) {
    return { ok: true, trustedProjectId };
  }
  if (!isUuid(claim)) {
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Invalid project claim", false);
  }

  if (trustedProjectId && claim !== trustedProjectId) {
    return fail(
      AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      "Project claim does not match trusted project",
      false
    );
  }

  // Claim present with no derived project yet — prove claim itself, never use unverified.
  if (!trustedProjectId) {
    const proof = await verifyProjectBelongsToTenant(supabase, claim, tenantId);
    if (!proof.ok) {
      return fail(proof.code, proof.reason, proof.retryable);
    }
    return { ok: true, trustedProjectId: proof.projectId };
  }

  return { ok: true, trustedProjectId };
}

async function resolveFromMediaId(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string,
  trustedProjectId: string | null
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
    return null;
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

  let mediaTrustedProject: string | null = null;
  if (row.project_id) {
    const proof = await verifyProjectBelongsToTenant(supabase, row.project_id, tenantId);
    if (!proof.ok) {
      // Foreign / missing media.project_id — fail closed (do not sign).
      return fail(proof.code, proof.reason, proof.retryable);
    }
    mediaTrustedProject = proof.projectId;
  }

  if (
    trustedProjectId &&
    mediaTrustedProject &&
    trustedProjectId !== mediaTrustedProject
  ) {
    return fail(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED, "Media project mismatch", false);
  }

  const effectiveTrusted = trustedProjectId ?? mediaTrustedProject;

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

  // Central chokepoint re-proves project-prefixed paths against projects table.
  const signed = await createSignedUrlForPath(supabase, extracted.path, { tenantId });
  if (signed.ok) {
    return {
      ...signed,
      source: "media",
      trustedProjectId: signed.trustedProjectId ?? effectiveTrusted,
    };
  }
  return signed;
}

async function resolveFromUploadSession(
  supabase: SupabaseClient,
  uploadSessionId: string,
  tenantId: string,
  trustedProjectId: string | null
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

  const signed = await createSignedUrlForPath(supabase, rel, { tenantId });
  if (signed.ok) {
    return {
      ...signed,
      source: "upload_session",
      trustedProjectId: signed.trustedProjectId ?? trustedProjectId,
    };
  }
  return signed;
}

async function resolveFromLegacyImageUrl(
  supabase: SupabaseClient,
  imageUrl: string,
  tenantId: string,
  trustedProjectId: string | null
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

  const signed = await createSignedUrlForPath(supabase, extracted.path, { tenantId });
  if (signed.ok) {
    const source = /^https?:\/\//i.test(trimmed) ? "legacy_storage_url" : "storage_path";
    return {
      ...signed,
      source,
      trustedProjectId: signed.trustedProjectId ?? trustedProjectId,
    };
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

  const claim =
    typeof input.projectIdClaim === "string" && input.projectIdClaim.trim()
      ? input.projectIdClaim.trim()
      : null;

  let trustedProjectId: string | null = null;

  if (input.reportId) {
    const derived = await deriveTrustedProjectFromReport(supabase, input.reportId, tenantId);
    if (!derived.ok) return derived;
    trustedProjectId = derived.projectId;
  }

  const claimResolved = await resolveClaimAgainstTrusted(
    supabase,
    claim,
    trustedProjectId,
    tenantId
  );
  if (!claimResolved.ok) return claimResolved;
  trustedProjectId = claimResolved.trustedProjectId;

  const pendingNotReady: ResolveAIMediaImageFailure[] = [];
  const permanentFailures: ResolveAIMediaImageFailure[] = [];

  if (input.mediaId) {
    const mediaResult = await resolveFromMediaId(
      supabase,
      input.mediaId,
      tenantId,
      trustedProjectId
    );
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
    const sessionResult = await resolveFromUploadSession(
      supabase,
      input.uploadSessionId,
      tenantId,
      trustedProjectId
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
      trustedProjectId
    );
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
