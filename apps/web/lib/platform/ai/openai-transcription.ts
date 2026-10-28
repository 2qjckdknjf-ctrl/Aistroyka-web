/**
 * OpenAI speech-to-text (Whisper-compatible) via /v1/audio/transcriptions.
 */

import { fetchWithOpenAiRetry } from "./openai-http-retry";

export const OPENAI_AUDIO_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

/** ISO-639-1 two-letter code for Whisper `language` (from `en`, `en-US`, etc.). */
export function normalizeWhisperLanguage(raw: string | null | undefined): string | null {
  const t = raw?.trim().toLowerCase();
  if (!t) return null;
  const m = /^([a-z]{2})(?:[-_][a-z0-9]+)?$/i.exec(t);
  return m ? m[1]!.toLowerCase() : null;
}

export interface TranscribeOpenAiAudioInput {
  apiKey: string;
  model: string;
  audioBytes: Uint8Array;
  filename: string;
  mimeType: string;
  /** ISO-639-1 hint (e.g. ru, en); improves accuracy when known. */
  language?: string | null;
  timeoutMs: number;
  maxRetries: number;
}

export type TranscriptionSegment = {
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
};

export interface TranscribeOpenAiAudioResult {
  text: string;
  durationSeconds: number | null;
  durationMs: number;
  /** Present when verbose_json includes Whisper segments. */
  segments: TranscriptionSegment[];
}

interface VerboseTranscriptionJson {
  text?: string;
  duration?: number;
  segments?: Array<{ start?: number; end?: number; text?: string }>;
}

export function parseVerboseTranscriptionSegments(
  segments: VerboseTranscriptionJson["segments"]
): TranscriptionSegment[] {
  if (!Array.isArray(segments)) return [];
  const out: TranscriptionSegment[] = [];
  for (const item of segments.slice(0, 2000)) {
    if (!item || typeof item !== "object") continue;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) continue;
    out.push({
      startSeconds:
        typeof item.start === "number" && Number.isFinite(item.start) ? item.start : null,
      endSeconds: typeof item.end === "number" && Number.isFinite(item.end) ? item.end : null,
      text: text.slice(0, 4000),
    });
  }
  return out;
}

export async function transcribeOpenAiAudio(
  input: TranscribeOpenAiAudioInput
): Promise<TranscribeOpenAiAudioResult> {
  const start = Date.now();

  const res = await fetchWithOpenAiRetry(
    OPENAI_AUDIO_TRANSCRIPTIONS_URL,
    (signal) => {
      const form = new FormData();
      const bytesCopy = Uint8Array.from(input.audioBytes);
      const blob = new Blob([bytesCopy], { type: input.mimeType || "application/octet-stream" });
      form.append("file", blob, input.filename || "audio.webm");
      form.append("model", input.model);
      form.append("response_format", "verbose_json");
      const lang = normalizeWhisperLanguage(input.language);
      if (lang) {
        form.append("language", lang);
      }
      return {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
        },
        body: form,
        signal,
      };
    },
    { maxRetries: input.maxRetries, timeoutMs: input.timeoutMs }
  );

  const durationMs = Date.now() - start;
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`openai_transcription_http_${res.status}: ${bodyText.slice(0, 240)}`);
  }

  let parsed: VerboseTranscriptionJson;
  try {
    parsed = JSON.parse(bodyText) as VerboseTranscriptionJson;
  } catch {
    throw new Error("openai_transcription_invalid_json");
  }

  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  const durationSeconds =
    typeof parsed.duration === "number" && Number.isFinite(parsed.duration) ? parsed.duration : null;
  const segments = parseVerboseTranscriptionSegments(parsed.segments);

  return { text, durationSeconds, durationMs, segments };
}
