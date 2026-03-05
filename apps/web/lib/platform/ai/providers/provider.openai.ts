/**
 * OpenAI vision provider. Uses OPENAI_API_KEY and OPENAI_VISION_MODEL.
 */

import { getServerConfig } from "@/lib/config/server";
import type { VisionResult, VisionOptions } from "./provider.interface";

const NAME = "openai";

export async function invokeVision(
  imageUrl: string,
  options?: VisionOptions
): Promise<VisionResult | null> {
  const config = getServerConfig();
  const apiKey = config.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const model = options?.model ?? config.OPENAI_VISION_MODEL ?? "gpt-4o";
  const systemPrompt = "You are a construction site analyst. Respond with JSON: stage, completion_percent, risk_level (low|medium|high), detected_issues (array), recommendations (array).";
  const userContent = "Analyze this construction site image.";
  const body = {
    model,
    response_format: { type: "json_object" as const },
    max_tokens: options?.maxTokens ?? 1024,
    temperature: 0,
    messages: [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userContent },
          { type: "image_url" as const, image_url: { url: imageUrl } },
        ],
      },
    ],
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(85_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty OpenAI response");
  const result: VisionResult = {
    content,
    usage: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens ?? 0,
          completion_tokens: data.usage.completion_tokens ?? 0,
          total_tokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
    providerUsed: NAME,
    modelUsed: model,
  };
  return result;
}

export const openaiProvider = { name: NAME, invokeVision };
