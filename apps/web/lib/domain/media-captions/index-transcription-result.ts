import type { SupabaseClient } from "@supabase/supabase-js";
import type { TranscribeOpenAiAudioResult } from "@/lib/platform/ai/openai-transcription";
import { replaceMediaCaptionSegments } from "./media-caption-index.service";

export type IndexTranscriptionResultInput = {
  tenantId: string;
  projectId: string;
  mediaId: string;
  actorUserId: string;
  language?: string | null;
  result: Pick<TranscribeOpenAiAudioResult, "text" | "segments">;
};

/**
 * AIS-STREAM-010: persist final Whisper transcript into MEM-016 caption index.
 * Best-effort from the HTTP path — failure returns a code without failing transcription.
 */
export async function indexTranscriptionResult(
  supabase: SupabaseClient,
  input: IndexTranscriptionResultInput
): Promise<{ indexed: boolean; inserted: number; code?: string }> {
  const indexed = await replaceMediaCaptionSegments(supabase, {
    tenantId: input.tenantId,
    projectId: input.projectId,
    mediaId: input.mediaId,
    actorUserId: input.actorUserId,
    sourceKind: "transcription",
    language: input.language ?? null,
    segments: input.result.segments ?? [],
    fullText: input.result.text,
  });
  if (!indexed.ok) {
    return { indexed: false, inserted: 0, code: indexed.code };
  }
  return { indexed: true, inserted: indexed.inserted };
}
