/**
 * Google Gemini vision provider. Uses GOOGLE_AI_API_KEY (or GEMINI_API_KEY) and GEMINI_VISION_MODEL.
 * Optional: if key missing, returns null. Fetches image from URL and sends as inline base64.
 */

import { getServerConfig } from "@/lib/config/server";
import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "@/lib/ai/prompts";
import type { VisionResult, VisionOptions } from "./provider.interface";

const NAME = "gemini";
const DEFAULT_TIMEOUT_MS = 85_000;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(imageUrl, {
    signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
    headers: { Accept: "image/*" },
  });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const blob = await res.blob();
  const buf = await blob.arrayBuffer();
  const base64 = toBase64(buf);
  const mimeType = blob.type?.startsWith("image/") ? blob.type : "image/jpeg";
  return { data: base64, mimeType };
}

export async function invokeVision(
  imageUrl: string,
  options?: VisionOptions
): Promise<VisionResult | null> {
  const config = getServerConfig();
  const apiKey = config.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = options?.model ?? config.GEMINI_VISION_MODEL ?? "gemini-1.5-flash";
  const maxTokens = options?.maxTokens ?? 1024;

  let imagePayload: { data: string; mimeType: string };
  try {
    imagePayload = await fetchImageAsBase64(imageUrl);
  } catch (e) {
    throw new Error(`Gemini image fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  const systemPlusUser = `${CONSTRUCTION_VISION_SYSTEM_PROMPT}\n\n${CONSTRUCTION_VISION_USER_MESSAGE}`;
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: imagePayload.mimeType, data: imagePayload.data } },
          { text: systemPlusUser },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty Gemini response");

  const um = data.usageMetadata;
  const result: VisionResult = {
    content: text,
    usage:
      um != null
        ? {
            prompt_tokens: um.promptTokenCount ?? 0,
            completion_tokens: um.candidatesTokenCount ?? 0,
            total_tokens: um.totalTokenCount ?? (um.promptTokenCount ?? 0) + (um.candidatesTokenCount ?? 0),
          }
        : undefined,
    providerUsed: NAME,
    modelUsed: model,
  };
  return result;
}

export const geminiProvider = { name: NAME, invokeVision };
