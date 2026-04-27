/**
 * Adapter boundary between Copilot business logic and AI provider.
 * All LLM/generation calls go through this interface; no direct provider calls elsewhere.
 */

import type { CopilotUseCase } from "./copilot.types";
import type { CopilotContextData } from "./copilot.context-builder";
import type { ILLMAdapter } from "@/lib/ai-brain/types";

export interface CopilotProviderResult {
  raw: string;
  structured?: Record<string, unknown>;
  /** Populated by OpenAI provider for billing when wired by the route. */
  usageMeta?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
  };
}

/** Provider interface: generates from prompt + context. Implement with real LLM or mock. */
export interface ICopilotProvider {
  generateFromPrompt(
    prompt: string,
    useCase: CopilotUseCase,
    context: CopilotContextData
  ): Promise<CopilotProviderResult>;
  isAvailable(): boolean;
}

/** No-op provider when no LLM is configured. */
export const nullCopilotProvider: ICopilotProvider = {
  isAvailable: () => false,
  async generateFromPrompt() {
    return { raw: "" };
  },
};

/** Wraps ILLMAdapter for ICopilotProvider (prompt + use case forwarded). */
export function createAdapterCopilotProvider(llm: ILLMAdapter): ICopilotProvider {
  return {
    isAvailable: () => llm.isAvailable(),
    async generateFromPrompt(prompt, useCase, context) {
      const result = await llm.generateFromPrompt(prompt, useCase, {
        projectId: context.projectId,
        tenantId: context.tenantId,
      });
      return {
        raw: result.raw ?? result.summary ?? "",
        structured: result.structured,
      };
    },
  };
}
