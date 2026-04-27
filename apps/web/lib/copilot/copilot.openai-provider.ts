/**
 * OpenAI-backed ICopilotProvider for non-streaming Copilot briefs.
 * Uses shared chat completion client (retries, timeout, JSON mode); records usage via optional callback.
 */

import { getServerConfig } from "@/lib/config/server";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { completeOpenAiChatJson } from "@/lib/platform/ai/openai-chat-completion";
import type { CopilotUseCase } from "./copilot.types";
import type { CopilotContextData } from "./copilot.context-builder";
import type { ICopilotProvider, CopilotProviderResult } from "./copilot.provider";

export interface OpenAiCopilotProviderOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
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
  const cfg = getServerConfig();
  const model = (opts.model ?? cfg.OPENAI_COPILOT_MODEL).trim() || "gpt-4o-mini";
  const timeoutMs = opts.timeoutMs ?? cfg.OPENAI_COPILOT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? cfg.OPENAI_COPILOT_MAX_RETRIES;

  return {
    isAvailable: () => opts.apiKey.length > 0,
    async generateFromPrompt(prompt, useCase, context): Promise<CopilotProviderResult> {
      const out = await completeOpenAiChatJson({
        apiKey: opts.apiKey,
        model,
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
        maxTokens: 1200,
        temperature: 0.3,
        responseFormatJsonObject: true,
        timeoutMs,
        maxRetries,
      });

      const pt = out.usage.prompt_tokens;
      const ct = out.usage.completion_tokens;
      const costUsd = estimateCostUsd(model, pt, ct);

      await opts.onUsage?.({
        model,
        promptTokens: pt,
        completionTokens: ct,
        durationMs: out.durationMs,
        costUsd,
      });

      return {
        raw: out.rawContent,
        structured: out.structured,
        usageMeta: {
          model,
          promptTokens: pt,
          completionTokens: ct,
          durationMs: out.durationMs,
        },
      };
    },
  };
}

/** Factory using server env (OPENAI_API_KEY, copilot model/timeout/retries). */
export function createOpenAiCopilotProviderFromEnv(
  onUsage?: OpenAiCopilotProviderOptions["onUsage"]
): ICopilotProvider | null {
  const { OPENAI_API_KEY } = getServerConfig();
  if (!OPENAI_API_KEY) return null;
  return createOpenAiCopilotProvider({ apiKey: OPENAI_API_KEY, onUsage });
}
