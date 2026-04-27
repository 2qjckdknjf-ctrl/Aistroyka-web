/**
 * Non-streaming OpenAI chat completions with JSON model output parsing.
 */

import { fetchWithOpenAiRetry } from "./openai-http-retry";

export const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAiChatRole = "system" | "user" | "assistant";

export interface OpenAiChatMessage {
  role: OpenAiChatRole;
  content: string;
}

export interface CompleteOpenAiChatJsonInput {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  maxTokens: number;
  temperature: number;
  /** When true, request JSON object mode (system prompt must mention JSON). */
  responseFormatJsonObject: boolean;
  timeoutMs: number;
  maxRetries: number;
}

export interface CompleteOpenAiChatJsonResult {
  rawContent: string;
  structured: Record<string, unknown>;
  usage: { prompt_tokens: number; completion_tokens: number };
  durationMs: number;
}

export async function completeOpenAiChatJson(
  input: CompleteOpenAiChatJsonInput
): Promise<CompleteOpenAiChatJsonResult> {
  const start = Date.now();
  const payload: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
  };
  if (input.responseFormatJsonObject) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetchWithOpenAiRetry(
    OPENAI_CHAT_COMPLETIONS_URL,
    (signal) => ({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    }),
    { maxRetries: input.maxRetries, timeoutMs: input.timeoutMs }
  );

  const durationMs = Date.now() - start;
  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(`openai_chat_http_${res.status}: ${bodyText.slice(0, 240)}`);
  }

  let parsedBody: {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    parsedBody = JSON.parse(bodyText) as typeof parsedBody;
  } catch {
    throw new Error("openai_chat_invalid_envelope_json");
  }

  const content = parsedBody.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("openai_chat_empty_content");
  }

  let structured: Record<string, unknown>;
  try {
    structured = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("openai_chat_model_non_json");
  }

  const pt = typeof parsedBody.usage?.prompt_tokens === "number" ? parsedBody.usage.prompt_tokens : 0;
  const ct =
    typeof parsedBody.usage?.completion_tokens === "number" ? parsedBody.usage.completion_tokens : 0;

  return {
    rawContent: content,
    structured,
    usage: { prompt_tokens: pt, completion_tokens: ct },
    durationMs,
  };
}
