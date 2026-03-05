/**
 * Google Gemini vision provider. Uses GOOGLE_AI_API_KEY or GEMINI_API_KEY and GEMINI_VISION_MODEL.
 * Optional: if key missing, returns null (unavailable). Never logs secrets.
 * Images: fetches imageUrl and sends as inline_data (base64) per Gemini API.
 */

import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "@/lib/ai/prompts";
import type { VisionResult, VisionOptions } from "./provider.interface";
import { ProviderRequestError } from "./provider.errors";

const NAME = "gemini";
const DEFAULT_MODEL = "gemini-1.5-flash";
const TIMEOUT_MS = 85_000;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

function getConfig(): { apiKey: string; model: string } {
  const apiKey = (
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    ""
  ).trim();
  const model =
    (process.env.GEMINI_VISION_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  return { apiKey, model };
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(imageUrl, {
    signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new ProviderRequestError(`Image fetch failed: ${res.status}`, "invalid_input");
  const contentType = res.headers.get("content-type") ?? "";
  const mimeType = contentType.includes("png")
    ? "image/png"
    : contentType.includes("webp")
      ? "image/webp"
      : contentType.includes("gif")
        ? "image/gif"
        : "image/jpeg";
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  return { data: base64, mimeType };
}

function mapToProviderError(e: unknown, statusCode?: number): ProviderRequestError {
  if (e instanceof ProviderRequestError) return e;
  const msg = e instanceof Error ? e.message : "Gemini request failed";
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

export async function invokeVision(
  imageUrl: string,
  options?: VisionOptions
): Promise<VisionResult | null> {
  const { apiKey, model } = getConfig();
  if (!apiKey) return null;

  const resolvedModel = options?.model ?? model;
  const maxTokens = options?.maxTokens ?? 1024;

  const { data: imageBase64, mimeType } = await fetchImageAsBase64(imageUrl);

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `${CONSTRUCTION_VISION_SYSTEM_PROMPT}\n\n${CONSTRUCTION_VISION_USER_MESSAGE}` },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw mapToProviderError(e);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    const msg = data?.error?.message ?? `Gemini ${res.status}`;
    throw mapToProviderError(new Error(msg), res.status);
  }

  const text =
    data.candidates?.[0]?.content?.parts?.find((p) => p.text != null)?.text?.trim();
  if (!text) throw new ProviderRequestError("Empty Gemini response", "unknown");

  const usage = data.usageMetadata;
  const promptTokens = usage?.promptTokenCount ?? 0;
  const completionTokens = usage?.candidatesTokenCount ?? usage?.totalTokenCount ?? 0;
  const totalTokens = usage?.totalTokenCount ?? promptTokens + completionTokens;

  const result: VisionResult = {
    content: text,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
    providerUsed: NAME,
    modelUsed: resolvedModel,
  };
  return result;
}

export const geminiProvider = {
  name: NAME,
  invokeVision,
};
