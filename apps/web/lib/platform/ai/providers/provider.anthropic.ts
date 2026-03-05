/**
 * Anthropic vision provider. Uses ANTHROPIC_API_KEY and ANTHROPIC_VISION_MODEL.
 * Optional: if key missing, returns null (unavailable). Never logs secrets.
 */

import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "@/lib/ai/prompts";
import type { VisionResult, VisionOptions } from "./provider.interface";
import { ProviderRequestError } from "./provider.errors";

const NAME = "anthropic";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const TIMEOUT_MS = 85_000;
const ANTHROPIC_VERSION = "2023-06-01";

function getConfig(): { apiKey: string; model: string } {
  const apiKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  const model =
    (process.env.ANTHROPIC_VISION_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  return { apiKey, model };
}

function mapToProviderError(e: unknown, statusCode?: number): ProviderRequestError {
  if (e instanceof ProviderRequestError) return e;
  const msg = e instanceof Error ? e.message : "Anthropic request failed";
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

  const body = {
    model: resolvedModel,
    max_tokens: maxTokens,
    system: CONSTRUCTION_VISION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: CONSTRUCTION_VISION_USER_MESSAGE },
          {
            type: "image" as const,
            source: { type: "url" as const, url: imageUrl },
          },
        ],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw mapToProviderError(e);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { type?: string; message?: string };
  };

  if (!res.ok) {
    const msg = data?.error?.message ?? `Anthropic ${res.status}`;
    throw mapToProviderError(new Error(msg), res.status);
  }

  const textBlock = data.content?.find((b) => b.type === "text");
  const content = textBlock?.text?.trim();
  if (!content) throw new ProviderRequestError("Empty Anthropic response", "unknown");

  const usage = data.usage;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;

  const result: VisionResult = {
    content,
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
    providerUsed: NAME,
    modelUsed: resolvedModel,
  };
  return result;
}

export const anthropicProvider = {
  name: NAME,
  invokeVision,
};
