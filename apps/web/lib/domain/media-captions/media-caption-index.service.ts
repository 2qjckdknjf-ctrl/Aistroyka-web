import type { SupabaseClient } from "@supabase/supabase-js";
import type { TranscriptionSegment } from "@/lib/platform/ai/openai-transcription";

export type CaptionSourceKind = "transcription" | "caption" | "manual";

export type IndexCaptionSegmentsInput = {
  tenantId: string;
  projectId: string;
  mediaId: string;
  actorUserId: string;
  sourceKind?: CaptionSourceKind;
  language?: string | null;
  segments: TranscriptionSegment[];
  /** When segments empty but full text present, store one unknown-clock segment. */
  fullText?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function secondsToMs(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 1000);
}

/**
 * Replace caption segments for a media source (idempotent re-index).
 * Does not claim work completion from missing coverage.
 */
export async function replaceMediaCaptionSegments(
  supabase: SupabaseClient,
  input: IndexCaptionSegmentsInput
): Promise<
  | { ok: true; inserted: number }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim().toLowerCase();
  const projectId = input.projectId.trim().toLowerCase();
  const mediaId = input.mediaId.trim().toLowerCase();
  const actorUserId = input.actorUserId.trim().toLowerCase();
  const sourceKind = input.sourceKind ?? "transcription";
  const language = input.language?.trim() || null;
  if (!tenantId || !projectId || !mediaId || !actorUserId) {
    return { ok: false, error: "required ids missing", code: "INVALID_INPUT" };
  }
  if (language !== null && (language.length < 2 || language.length > 16)) {
    return { ok: false, error: "language must contain 2 to 16 characters", code: "INVALID_INPUT" };
  }

  let segments = input.segments.filter((s) => s.text.trim().length > 0);
  if (segments.length === 0 && input.fullText?.trim()) {
    segments = [
      {
        startSeconds: null,
        endSeconds: null,
        text: input.fullText.trim().slice(0, 4000),
      },
    ];
  }
  if (segments.length === 0) {
    return { ok: false, error: "no caption text to index", code: "INVALID_INPUT" };
  }

  const rows = segments.slice(0, 2000).map((segment) => {
    const startMs = secondsToMs(segment.startSeconds);
    const endMs = secondsToMs(segment.endSeconds);
    const clock =
      startMs !== null && endMs !== null
        ? "exact"
        : startMs !== null || endMs !== null
          ? "estimated"
          : "unknown";
    return {
      start_ms: startMs,
      end_ms: endMs,
      text: segment.text.trim().slice(0, 4000),
      language,
      clock_uncertainty: clock,
    };
  });

  try {
    // The database authorizes the caller, binds all ids, locks the parent media,
    // and replaces rows in one transaction. Never fall back to delete + insert.
    const { data, error } = await supabase.rpc("replace_media_caption_segments", {
      p_tenant_id: tenantId,
      p_project_id: projectId,
      p_media_id: mediaId,
      p_actor_user_id: actorUserId,
      p_source_kind: sourceKind,
      p_segments: rows,
    });
    if (error) {
      if (error.code === "P0002") {
        return { ok: false, error: "Media does not belong to this project", code: "MEDIA_SCOPE_MISMATCH" };
      }
      if (error.code === "42501") {
        return { ok: false, error: "Insufficient rights", code: "INSUFFICIENT_RIGHTS" };
      }
      if (["22023", "22P02", "22003", "23502", "23514"].includes(error.code)) {
        return { ok: false, error: "Invalid caption segments", code: "INVALID_INPUT" };
      }
      return { ok: false, error: "Caption replacement failed", code: "REPLACE_FAILED" };
    }
    if (data !== rows.length) {
      return { ok: false, error: "Caption replacement failed", code: "REPLACE_FAILED" };
    }
    return { ok: true, inserted: data };
  } catch {
    return { ok: false, error: "Caption replacement failed", code: "REPLACE_FAILED" };
  }
}

export type SearchCaptionSegmentsInput = {
  tenantId: string;
  projectId: string;
  query: string;
  limit?: number;
};

/**
 * Lexical baseline search (ilike). Hybrid/embedding search is a later slice.
 */
export async function searchMediaCaptionSegments(
  supabase: SupabaseClient,
  input: SearchCaptionSegmentsInput
): Promise<
  | {
      ok: true;
      hits: Array<{
        id: string;
        media_id: string;
        start_ms: number | null;
        end_ms: number | null;
        text: string;
        clock_uncertainty: string;
      }>;
    }
  | { ok: false; error: string; code: string }
> {
  const tenantId = input.tenantId.trim();
  const projectId = input.projectId.trim();
  const query = input.query.trim();
  if (!tenantId || !projectId || query.length < 2) {
    return { ok: false, error: "query too short", code: "INVALID_INPUT" };
  }
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const pattern = `%${query.replace(/[%_]/g, "")}%`;

  const { data, error } = await supabase
    .from("media_caption_segments")
    .select("id, media_id, start_ms, end_ms, text, clock_uncertainty")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .ilike("text", pattern)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { ok: false, error: error.message, code: "LOOKUP_FAILED" };
  const hits = (Array.isArray(data) ? data : [])
    .filter(isRecord)
    .map((row) => ({
      id: asString(row.id) ?? "",
      media_id: asString(row.media_id) ?? "",
      start_ms: typeof row.start_ms === "number" ? row.start_ms : null,
      end_ms: typeof row.end_ms === "number" ? row.end_ms : null,
      text: asString(row.text) ?? "",
      clock_uncertainty: asString(row.clock_uncertainty) ?? "unknown",
    }))
    .filter((row) => row.id && row.media_id && row.text);

  return { ok: true, hits };
}
