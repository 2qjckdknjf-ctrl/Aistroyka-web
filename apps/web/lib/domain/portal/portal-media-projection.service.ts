/**
 * Portal media projection — short-lived signed URLs only.
 * Never exposes storage paths or permanent public URLs to owner/stakeholder APIs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AI_MEDIA_SIGNED_URL_TTL_SEC,
  createSignedUrlForPath,
  resolveAIMediaImage,
} from "@/lib/platform/ai/resolve-ai-media-image";
import type { VisualEvidenceRecord } from "@/lib/domain/visual-evidence/visual-evidence.service";

export type PortalSignedMediaProjection = {
  signed_url: string | null;
  expires_in_sec: number;
  unavailable_reason: string | null;
};

export async function projectSignedMediaForEvidence(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  evidence: Pick<
    VisualEvidenceRecord,
    "media_id" | "upload_session_id" | "report_id" | "owner_visible" | "project_id"
  >
): Promise<PortalSignedMediaProjection> {
  const expires_in_sec = AI_MEDIA_SIGNED_URL_TTL_SEC;

  if (!evidence.owner_visible) {
    return {
      signed_url: null,
      expires_in_sec,
      unavailable_reason: "not_owner_visible",
    };
  }

  if (evidence.project_id !== projectId) {
    return {
      signed_url: null,
      expires_in_sec,
      unavailable_reason: "project_mismatch",
    };
  }

  const resolved = await resolveAIMediaImage(supabase, {
    tenantId,
    reportId: evidence.report_id,
    mediaId: evidence.media_id,
    uploadSessionId: evidence.upload_session_id,
    projectIdClaim: projectId,
  });

  if (!resolved.ok) {
    return {
      signed_url: null,
      expires_in_sec,
      unavailable_reason: resolved.code,
    };
  }

  return {
    signed_url: resolved.imageUrl,
    expires_in_sec,
    unavailable_reason: null,
  };
}

export async function projectSignedMediaFromObjectPath(
  supabase: SupabaseClient,
  tenantId: string,
  objectPath: string
): Promise<PortalSignedMediaProjection> {
  const expires_in_sec = AI_MEDIA_SIGNED_URL_TTL_SEC;
  const signed = await createSignedUrlForPath(supabase, objectPath, { tenantId });
  if (!signed.ok) {
    return {
      signed_url: null,
      expires_in_sec,
      unavailable_reason: signed.code,
    };
  }
  return {
    signed_url: signed.imageUrl,
    expires_in_sec,
    unavailable_reason: null,
  };
}

/** Strip storage paths / public URLs from portal JSON payloads. */
export function assertPortalMediaPayloadSafe(payload: unknown): boolean {
  const json = JSON.stringify(payload);
  return !/(object_path|file_url|storage\/v1\/object\/public|bucket)/i.test(json);
}
