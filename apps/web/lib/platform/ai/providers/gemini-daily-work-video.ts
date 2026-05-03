/**
 * Gemini-only: upload a construction site video, analyze “work done for the reporting day”.
 * Uses Files API + generateContent; deletes the uploaded file in a finally block.
 */

import {
  DAILY_WORK_VIDEO_SYSTEM_PROMPT,
  buildDailyWorkVideoUserMessage,
} from "@/lib/ai/prompts";
import { ProviderRequestError } from "./provider.errors";
import type { VisionResult } from "./provider.interface";

const UPLOAD_TIMEOUT_MS = 180_000;
const GENERATE_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 2000;
const MAX_FILE_POLLS = 90;

function getApiKey(): string {
  return (process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "").trim();
}

function resolveModel(): string {
  return (
    (process.env.GEMINI_VIDEO_MODEL ?? process.env.GEMINI_VISION_MODEL ?? "gemini-1.5-flash").trim() || "gemini-1.5-flash"
  );
}

function videoMimeForGemini(contentType: string): string {
  const c = contentType.toLowerCase();
  if (c.includes("webm")) return "video/webm";
  if (c.includes("quicktime") || c.includes("mp4")) return "video/mp4";
  if (c.includes("mpeg")) return "video/mpeg";
  return "video/mp4";
}

function mapToProviderError(e: unknown, statusCode?: number): ProviderRequestError {
  if (e instanceof ProviderRequestError) return e;
  const msg = e instanceof Error ? e.message : "Gemini video request failed";
  if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("aborted"))
    return new ProviderRequestError(msg, "timeout", statusCode);
  if (statusCode === 401 || statusCode === 403)
    return new ProviderRequestError(msg, "auth", statusCode);
  if (statusCode === 429) return new ProviderRequestError(msg, "rate_limit", statusCode);
  if (statusCode && statusCode >= 400 && statusCode < 500)
    return new ProviderRequestError(msg, "invalid_input", statusCode);
  if (statusCode && statusCode >= 500)
    return new ProviderRequestError(msg, "server_error", statusCode);
  return new ProviderRequestError(msg, "unknown", statusCode);
}

async function uploadVideoFile(
  apiKey: string,
  videoBytes: Uint8Array,
  mimeType: string
): Promise<{ name: string; uri: string }> {
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`;
  const metadata = { file: { displayName: `aistroyka-daily-${Date.now()}` } };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([Uint8Array.from(videoBytes)], { type: mimeType }), "clip.bin");

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "X-Goog-Upload-Protocol": "multipart" },
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  } catch (e) {
    throw mapToProviderError(e);
  }

  const data = (await res.json()) as {
    file?: { name?: string; uri?: string; state?: string; error?: { message?: string } };
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = data?.error?.message ?? data?.file?.error?.message ?? `Gemini upload ${res.status}`;
    throw mapToProviderError(new Error(msg), res.status);
  }
  const name = data.file?.name;
  const uri = data.file?.uri;
  if (!name || !uri) throw new ProviderRequestError("Gemini upload missing file name", "invalid_input", res.status);
  return { name, uri };
}

async function waitForFileActive(apiKey: string, fileName: string): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(fileName)}?key=${encodeURIComponent(apiKey)}`;
  for (let i = 0; i < MAX_FILE_POLLS; i++) {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const data = (await r.json()) as { file?: { state?: string; error?: { message?: string } }; error?: { message?: string } };
    if (!r.ok) {
      const msg = data?.error?.message ?? `Gemini file status ${r.status}`;
      throw mapToProviderError(new Error(msg), r.status);
    }
    const state = data.file?.state;
    if (state === "ACTIVE") return;
    if (state === "FAILED") {
      const em = data.file?.error?.message ?? "processing failed";
      throw new ProviderRequestError(`Gemini file ${em}`, "invalid_input");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new ProviderRequestError("Gemini file activation timeout", "timeout");
}

async function deleteUploadedFile(apiKey: string, fileName: string): Promise<void> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(fileName)}?key=${encodeURIComponent(apiKey)}`;
    await fetch(url, { method: "DELETE", signal: AbortSignal.timeout(15_000) });
  } catch {
    // best-effort cleanup
  }
}

export interface GeminiDailyWorkVideoInput {
  videoBytes: Uint8Array;
  videoMimeType: string;
  /** Human-readable calendar date for the report, or "unspecified". */
  workDateLabel: string;
  maxOutputTokens?: number;
}

/**
 * Returns JSON text (application/json) suitable for parseJsonFromContent.
 */
export async function invokeGeminiDailyWorkVideoAnalysis(
  input: GeminiDailyWorkVideoInput
): Promise<VisionResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const model = resolveModel();
  const mimeType = videoMimeForGemini(input.videoMimeType);
  const userMessage = buildDailyWorkVideoUserMessage(input.workDateLabel);

  let fileName: string | null = null;
  try {
    const uploaded = await uploadVideoFile(apiKey, input.videoBytes, mimeType);
    fileName = uploaded.name;
    await waitForFileActive(apiKey, uploaded.name);

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${DAILY_WORK_VIDEO_SYSTEM_PROMPT}\n\n${userMessage}` },
            {
              file_data: {
                mime_type: mimeType,
                file_uri: uploaded.uri,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: input.maxOutputTokens ?? 2048,
        temperature: 0,
        responseMimeType: "application/json",
      },
    };

    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let res: Response;
    try {
      res = await fetch(genUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });
    } catch (e) {
      throw mapToProviderError(e);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data?.error?.message ?? `Gemini generateContent ${res.status}`;
      throw mapToProviderError(new Error(msg), res.status);
    }

    const text =
      data.candidates?.[0]?.content?.parts?.find((p) => p.text != null)?.text?.trim();
    if (!text) throw new ProviderRequestError("Empty Gemini video response", "unknown");

    const usage = data.usageMetadata;
    const promptTokens = usage?.promptTokenCount ?? 0;
    const completionTokens = usage?.candidatesTokenCount ?? usage?.totalTokenCount ?? 0;
    const totalTokens = usage?.totalTokenCount ?? promptTokens + completionTokens;

    return {
      content: text,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
      providerUsed: "gemini",
      modelUsed: model,
    };
  } finally {
    if (fileName) void deleteUploadedFile(apiKey, fileName);
  }
}
