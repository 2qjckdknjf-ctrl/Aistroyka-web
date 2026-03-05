/**
 * Tenant AI preferences from tenant_feature_flags (single source of truth for router).
 * Keys: ai_provider_preference (variant = openai | anthropic | gemini), ai_fallback_enabled (enabled = use fallback).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getTenantOverrides } from "@/lib/platform/flags/flags.repository";

export const AI_PROVIDER_PREFERENCE_KEY = "ai_provider_preference";
export const AI_FALLBACK_ENABLED_KEY = "ai_fallback_enabled";

const VALID_PROVIDERS = new Set(["openai", "anthropic", "gemini"]);

export interface TenantAiPreferences {
  preferredProvider: string | null;
  fallbackEnabled: boolean;
}

export async function getTenantAiPreferences(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<TenantAiPreferences> {
  if (!tenantId) return { preferredProvider: null, fallbackEnabled: true };
  const overrides = await getTenantOverrides(supabase, tenantId);
  let preferredProvider: string | null = null;
  let fallbackEnabled = true;
  for (const row of overrides) {
    if (row.key === AI_PROVIDER_PREFERENCE_KEY && row.variant?.trim()) {
      const v = row.variant.trim().toLowerCase();
      if (VALID_PROVIDERS.has(v)) preferredProvider = v;
    }
    if (row.key === AI_FALLBACK_ENABLED_KEY) fallbackEnabled = row.enabled;
  }
  return { preferredProvider, fallbackEnabled };
}

/** Build ordered provider names: preferred first (if set and valid), then default order. */
export function orderProviderNames(
  preferred: string | null,
  defaultOrder: string[] = ["openai", "anthropic", "gemini"]
): string[] {
  if (!preferred || !VALID_PROVIDERS.has(preferred)) return [...defaultOrder];
  const rest = defaultOrder.filter((p) => p !== preferred);
  return [preferred, ...rest];
}
