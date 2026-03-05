/**
 * Tenant AI preferences from tenant_feature_flags (single source of truth).
 * Keys: ai_provider_preference (variant: openai|anthropic|gemini), ai_model_tier (variant: low|standard|high), ai_fallback_enabled (enabled: boolean).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface TenantAIPreferences {
  providerPreference?: "openai" | "anthropic" | "gemini";
  modelTier?: "low" | "standard" | "high";
  fallbackEnabled: boolean;
}

const PREFERENCE_KEY = "ai_provider_preference";
const MODEL_TIER_KEY = "ai_model_tier";
const FALLBACK_KEY = "ai_fallback_enabled";

export async function getTenantAIPreferences(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<TenantAIPreferences> {
  if (!tenantId) {
    return { fallbackEnabled: true };
  }
  const { data, error } = await supabase
    .from("tenant_feature_flags")
    .select("key, enabled, variant")
    .eq("tenant_id", tenantId)
    .in("key", [PREFERENCE_KEY, MODEL_TIER_KEY, FALLBACK_KEY]);
  if (error) return { fallbackEnabled: true };
  const rows = (data ?? []) as { key: string; enabled: boolean; variant: string | null }[];
  const prefs: TenantAIPreferences = { fallbackEnabled: true };
  for (const r of rows) {
    if (r.key === PREFERENCE_KEY && r.variant) {
      if (r.variant === "openai" || r.variant === "anthropic" || r.variant === "gemini") {
        prefs.providerPreference = r.variant;
      }
    } else if (r.key === MODEL_TIER_KEY && r.variant) {
      if (r.variant === "low" || r.variant === "standard" || r.variant === "high") {
        prefs.modelTier = r.variant;
      }
    } else if (r.key === FALLBACK_KEY) {
      prefs.fallbackEnabled = r.enabled;
    }
  }
  return prefs;
}
