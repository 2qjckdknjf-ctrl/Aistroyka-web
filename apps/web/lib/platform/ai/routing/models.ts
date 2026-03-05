/**
 * Model tier → provider-specific model name. Single place for routing defaults.
 * Keeps compatibility with current OpenAI default (gpt-4o).
 */

export type ModelTier = "low" | "standard" | "high";

const OPENAI_MODELS: Record<ModelTier, string> = {
  low: "gpt-4o-mini",
  standard: "gpt-4o",
  high: "gpt-4o",
};

const ANTHROPIC_MODELS: Record<ModelTier, string> = {
  low: "claude-3-5-haiku-20241022",
  standard: "claude-3-5-sonnet-20241022",
  high: "claude-3-5-sonnet-20241022",
};

const GEMINI_MODELS: Record<ModelTier, string> = {
  low: "gemini-1.5-flash",
  standard: "gemini-1.5-flash",
  high: "gemini-1.5-pro",
};

const PROVIDER_MODELS: Record<string, Record<ModelTier, string>> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  gemini: GEMINI_MODELS,
};

/** Map subscription tier (free/pro/enterprise) to model tier. */
export function subscriptionTierToModelTier(tier: string): ModelTier {
  const t = (tier ?? "free").toLowerCase();
  if (t === "enterprise" || t === "pro") return "high";
  if (t === "free") return "standard";
  return "standard";
}

/** Resolve provider-specific model name for a model tier. Defaults to standard/gpt-4o for unknown provider. */
export function getModelForProvider(providerName: string, tier: string): string {
  const modelTier = subscriptionTierToModelTier(tier);
  const map = PROVIDER_MODELS[providerName ?? ""];
  if (!map) return providerName === "openai" ? OPENAI_MODELS.standard : "gpt-4o";
  return map[modelTier] ?? map.standard;
}
