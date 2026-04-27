/**
 * OpenAI-backed ICopilotProvider for non-streaming Copilot briefs.
 * Uses chat completions + JSON object mode; records usage via optional callback.
 */

import { getServerConfig } from "@/lib/config/server";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import type { CopilotUseCase } from "./copilot.types";
import type { CopilotContextData } from "./copilot.context-builder";
import type { ICopilotProvider, CopilotProviderResult } from "./copilot.provider";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export interface OpenAiCopilotProviderOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  onUsage?: (payload: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    costUsd: number;
  }) => void | Promise<void>;
}

function jsonSystemPreamble(useCase: CopilotUseCase): string {
  return [
    "You are a construction project intelligence assistant.",
    "Answer using only facts implied by the user message (the context block).",
    "Do not invent metrics, dates, or site conditions that are not supported by the context.",
    `Task type: ${useCase}.`,
    'Respond with a single JSON object. Include only keys that are useful for this task.',
    "Allowed keys: summary (string), bullets (string[]), risks (string[]), missingEvidence (string[]),",
    "blockedTasks (string[]), managerBrief (string), executiveBrief (string).",
    "The word JSON appears here because the API requires json in the system instructions.",
  ].join(" ");
}

export function createOpenAiCopilotProvider(opts: OpenAiCopilotProviderOptions): ICopilotProvider {
  const model = (opts.model ?? process.env.OPENAI_COPILOT_MODEL ?? "gpt-4o-mini").trim() || "gpt-4o-mini";
  const timeoutMs = opts.timeoutMs ?? 55_000;

  return {
    isAvailable: () => opts.apiKey.length > 0,
    async generateFromPrompt(prompt, useCase, context): Promise<CopilotProviderResult> {
      const start = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(OPENAI_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: jsonSystemPreamble(useCase) },
              {
                role: "user",
                content: [
                  `projectId=${context.projectId}`,
                  `tenantId=${context.tenantId}`,
                  "",
                  prompt,
                ].join("\n"),
              },
            ],
            max_tokens: 1200,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });

        const durationMs = Date.now() - start;
        const bodyText = await res.text();

        if (!res.ok) {
          throw new Error(`openai_copilot_http_${res.status}: ${bodyText.slice(0, 200)}`);
        }

        const parsedBody = JSON.parse(bodyText) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const content = parsedBody.choices?.[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("openai_copilot_empty_content");
        }

        let structured: Record<string, unknown>;
        try {
          structured = JSON.parse(content) as Record<string, unknown>;
        } catch {
          throw new Error("openai_copilot_non_json");
        }

        const pt = typeof parsedBody.usage?.prompt_tokens === "number" ? parsedBody.usage.prompt_tokens : 0;
        const ct =
          typeof parsedBody.usage?.completion_tokens === "number" ? parsedBody.usage.completion_tokens : 0;
        const costUsd = estimateCostUsd(model, pt, ct);

        await opts.onUsage?.({
          model,
          promptTokens: pt,
          completionTokens: ct,
          durationMs,
          costUsd,
        });

        return {
          raw: content,
          structured,
          usageMeta: {
            model,
            promptTokens: pt,
            completionTokens: ct,
            durationMs,
          },
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** Factory using server env (OPENAI_API_KEY, optional OPENAI_COPILOT_MODEL). */
export function createOpenAiCopilotProviderFromEnv(
  onUsage?: OpenAiCopilotProviderOptions["onUsage"]
): ICopilotProvider | null {
  const { OPENAI_API_KEY } = getServerConfig();
  if (!OPENAI_API_KEY) return null;
  return createOpenAiCopilotProvider({ apiKey: OPENAI_API_KEY, onUsage });
}
