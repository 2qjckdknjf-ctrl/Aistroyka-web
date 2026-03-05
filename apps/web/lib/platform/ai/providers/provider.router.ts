/**
 * Router: select provider by tenant preference + tier + circuit state, invoke with fallback.
 * Uses tenant_feature_flags for ai_provider_preference and ai_fallback_enabled.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { canInvoke, recordSuccess, recordFailure } from "./circuit-breaker";
import { isRetryableError } from "./provider.errors";
import { openaiProvider } from "./provider.openai";
import { anthropicProvider } from "./provider.anthropic";
import { geminiProvider } from "./provider.gemini";
import { getTenantAiPreferences, orderProviderNames } from "@/lib/platform/ai/routing/tenant-ai-preferences";
import { getModelForProvider } from "@/lib/platform/ai/routing/models";
import type { VisionResult, VisionOptions } from "./provider.interface";

const PROVIDERS_BY_NAME: Record<string, { name: string; invokeVision: (url: string, opts?: VisionOptions) => Promise<VisionResult | null> }> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
};

const DEFAULT_ORDER = ["openai", "anthropic", "gemini"];

export interface RouterOptions extends VisionOptions {
  tier?: string;
  model?: string;
  /** When set, tenant_feature_flags are used for ai_provider_preference and ai_fallback_enabled. */
  tenantId?: string | null;
}

export async function invokeVisionWithRouter(
  supabase: SupabaseClient,
  imageUrl: string,
  options: RouterOptions
): Promise<VisionResult | null> {
  const tier = (options.tier ?? "free").toLowerCase();
  const prefs = await getTenantAiPreferences(supabase, options.tenantId ?? null);
  const names = orderProviderNames(prefs.preferredProvider, DEFAULT_ORDER);
  const candidateNames = prefs.fallbackEnabled ? names : names.slice(0, 1);

  for (const name of candidateNames) {
    const provider = PROVIDERS_BY_NAME[name];
    if (!provider) continue;
    if (!(await canInvoke(supabase, provider.name))) continue;

    const model = options.model ?? getModelForProvider(provider.name, tier);
    try {
      const result = await provider.invokeVision(imageUrl, {
        model,
        maxTokens: options.maxTokens,
      });
      if (result) {
        await recordSuccess(supabase, provider.name);
        return result;
      }
    } catch (err) {
      await recordFailure(supabase, provider.name);
      if (!isRetryableError(err)) break;
    }
  }
  return null;
}
