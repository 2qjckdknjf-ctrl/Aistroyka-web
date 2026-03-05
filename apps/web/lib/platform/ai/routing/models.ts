/**
 * Model tier to provider-specific model names. Single place for routing defaults.
 * Compatible with current OpenAI default (gpt-4o).
 */

export type ModelTier = "low" | "standard" | "high";

const OPENAI_MODELS: Record<ModelTier, string> = {
  low: "gpt-4o-mini",
  standard: "gpt-4o",
  high: "gpt-4o",
};

const ANTHROPIC_MODELS: Record<ModelTier, string> = {
  low: "claude-3-5-haiku",
  standard: "claude-sonnet-4-20250514",
  high: "claude-sonnet-4-20250514",
};

const GEMINI_MODELS: Record<ModelTier, string> = {
  low: "gemini-1.5-flash",
  standard: "gemini-1.5-flash",
  high: "gemini-1.5-pro",
};

export const MODEL_BY_PROVIDER_AND_TIER: Record<string, Record<ModelTier, string>> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  gemini: GEMINI_MODELS,
};

export const DEFAULT_MODEL_TIER: ModelTier = "standard";

/** Resolve model name for a provider and tier. Falls back to standard tier. */
export function modelForProviderAndTier(
  provider: string,
  tier: ModelTier | string | null | undefined
): string {
  const t = (tier === "low" || tier === "standard" || tier === "high" ? tier : DEFAULT_MODEL_TIER) as ModelTier;
  const map = MODEL_BY_PROVIDER_AND_TIER[provider];
  if (!map) return OPENAI_MODELS[DEFAULT_MODEL_TIER];
  return map[t] ?? map[DEFAULT_MODEL_TIER];
}
