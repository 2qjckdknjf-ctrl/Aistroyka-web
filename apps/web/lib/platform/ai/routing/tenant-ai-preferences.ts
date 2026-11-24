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

/**
 * Fail-closed default when tenant context is missing or flag read fails
 * (Codex delta 2026-11-24 P0 — no silent cross-provider fallback).
 * Operators may opt into legacy open fallback with AI_FALLBACK_ON_ERROR=true.
 */
function fallbackOnErrorDefault(): boolean {
  const raw = (process.env.AI_FALLBACK_ON_ERROR ?? "").trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return false;
}

export async function getTenantAIPreferences(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<TenantAIPreferences> {
  if (!tenantId) {
    return { fallbackEnabled: fallbackOnErrorDefault() };
  }
  const { data, error } = await supabase
    .from("tenant_feature_flags")
    .select("key, enabled, variant")
    .eq("tenant_id", tenantId)
    .in("key", [PREFERENCE_KEY, MODEL_TIER_KEY, FALLBACK_KEY]);
  if (error) return { fallbackEnabled: fallbackOnErrorDefault() };
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
