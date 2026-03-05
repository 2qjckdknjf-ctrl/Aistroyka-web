/**
 * Model routing per tier: FREE → cheaper, PRO → balanced, ENTERPRISE → best + fallback.
 * Returns model identifier for the provider (e.g. OpenAI model name).
 */

export type ModelTier = "free" | "pro" | "enterprise";

const MODELS: Record<ModelTier, { primary: string; fallback?: string }> = {
  free: { primary: "gpt-4o-mini" },
  pro: { primary: "gpt-4o", fallback: "gpt-4o-mini" },
  enterprise: { primary: "gpt-4o", fallback: "gpt-4o-mini" },
};

export function getModelForTier(tier: ModelTier): { primary: string; fallback?: string } {
  return MODELS[tier] ?? MODELS.free;
}
