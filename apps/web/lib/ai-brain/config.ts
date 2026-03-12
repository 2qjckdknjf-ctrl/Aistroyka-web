/**
 * AI Brain / Copilot config — provider capability flags and fallback.
 * Do not hardcode a single LLM provider in business logic.
 */

import { isOpenAIConfigured } from "@/lib/config";

export interface LLMProviderConfig {
  /** Whether an LLM is available for Copilot briefs */
  copilotLlmAvailable: boolean;
  /** Provider name for logging (e.g. openai, anthropic) */
  provider: string;
}

export function getLLMProviderConfig(): LLMProviderConfig {
  if (isOpenAIConfigured()) {
    return { copilotLlmAvailable: true, provider: "openai" };
  }
  return { copilotLlmAvailable: false, provider: "none" };
}

export function isCopilotLlmAvailable(): boolean {
  return getLLMProviderConfig().copilotLlmAvailable;
}
