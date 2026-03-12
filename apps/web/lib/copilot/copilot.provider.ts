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

/** Wraps legacy ILLMAdapter: uses context only (prompt ignored), calls generateBrief. */
export function createAdapterCopilotProvider(llm: ILLMAdapter): ICopilotProvider {
  return {
    isAvailable: () => llm.isAvailable(),
    async generateFromPrompt(_prompt, _useCase, context) {
      const result = await llm.generateBrief({
        projectId: context.projectId,
        tenantId: context.tenantId,
        reportsSummary: context.reportSummary,
        risksSummary: context.riskSummary,
        tasksSummary: context.taskSummary,
        evidenceSummary: context.evidenceSummary,
      });
      return {
        raw: result.raw ?? result.summary ?? "",
        structured: result.structured,
      };
    },
  };
}
