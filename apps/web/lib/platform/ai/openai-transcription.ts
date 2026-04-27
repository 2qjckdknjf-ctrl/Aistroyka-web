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

export interface TranscribeOpenAiAudioResult {
  text: string;
  durationSeconds: number | null;
  durationMs: number;
}

interface VerboseTranscriptionJson {
  text?: string;
  duration?: number;
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

  return { text, durationSeconds, durationMs };
}
