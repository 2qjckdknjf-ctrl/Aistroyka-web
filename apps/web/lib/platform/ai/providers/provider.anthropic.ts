/**
 * Anthropic vision provider. Uses ANTHROPIC_API_KEY and ANTHROPIC_VISION_MODEL.
 * Optional: if key missing, returns null (router skips). Uses Messages API with image URL.
 */

import { getServerConfig } from "@/lib/config/server";
import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "@/lib/ai/prompts";
import type { VisionResult, VisionOptions } from "./provider.interface";

const NAME = "anthropic";
const DEFAULT_TIMEOUT_MS = 85_000;

export async function invokeVision(
  imageUrl: string,
  options?: VisionOptions
): Promise<VisionResult | null> {
  const config = getServerConfig();
  const apiKey = config.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const model = options?.model ?? config.ANTHROPIC_VISION_MODEL ?? "claude-3-5-sonnet-20241022";
  const maxTokens = options?.maxTokens ?? 1024;

  const body = {
    model,
    max_tokens: maxTokens,
    system: CONSTRUCTION_VISION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: CONSTRUCTION_VISION_USER_MESSAGE },
          { type: "image" as const, source: { type: "url" as const, url: imageUrl } },
        ],
      },
    ],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const textBlock = data.content?.find((b) => b.type === "text");
  const content = textBlock?.text?.trim();
  if (!content) throw new Error("Empty Anthropic response");

  const usage = data.usage;
  const result: VisionResult = {
    content,
    usage:
      usage != null
        ? {
            prompt_tokens: usage.input_tokens ?? 0,
            completion_tokens: usage.output_tokens ?? 0,
            total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
          }
        : undefined,
    providerUsed: NAME,
    modelUsed: model,
  };
  return result;
}

export const anthropicProvider = { name: NAME, invokeVision };
