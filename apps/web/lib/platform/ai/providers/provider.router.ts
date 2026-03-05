/**
 * Router: tenant-aware provider order, model tier, circuit breaker, fallback.
 * Provider order from tenant_feature_flags (ai_provider_preference, ai_fallback_enabled).
 * Model from options.model or model tier (lib/platform/ai/routing/models.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { canInvoke, recordSuccess, recordFailure } from "./circuit-breaker";
import { isRetryableProviderError } from "./provider.errors";
import { openaiProvider } from "./provider.openai";
import { anthropicProvider } from "./provider.anthropic";
import { geminiProvider } from "./provider.gemini";
import type { VisionResult, VisionOptions } from "./provider.interface";
import { getTenantAIPreferences } from "@/lib/platform/ai/routing/tenant-ai-preferences";
import { modelForProviderAndTier, type ModelTier } from "@/lib/platform/ai/routing/models";

const PROVIDERS = [openaiProvider, anthropicProvider, geminiProvider];
const PROVIDER_BY_NAME = Object.fromEntries(PROVIDERS.map((p) => [p.name, p]));

export interface RouterOptions extends VisionOptions {
  tier?: string;
  model?: string;
  tenantId?: string | null;
  requestId?: string | null;
}

/** Order providers: preferred first (if set), then rest; if fallback disabled, preferred only. */
function orderProviders(
  preference: "openai" | "anthropic" | "gemini" | undefined,
  fallbackEnabled: boolean
): typeof PROVIDERS {
  if (!preference || !PROVIDER_BY_NAME[preference]) {
    return PROVIDERS;
  }
  const preferred = PROVIDER_BY_NAME[preference];
  const rest = PROVIDERS.filter((p) => p.name !== preference);
  if (!fallbackEnabled) return [preferred];
  return [preferred, ...rest];
}

export async function invokeVisionWithRouter(
  supabase: SupabaseClient,
  imageUrl: string,
  options: RouterOptions
): Promise<VisionResult | null> {
  const tenantId = options.tenantId ?? null;
  const prefs = await getTenantAIPreferences(supabase, tenantId);
  const ordered = orderProviders(prefs.providerPreference, prefs.fallbackEnabled);
  const modelTier: ModelTier | undefined = prefs.modelTier;

  for (const provider of ordered) {
    if (!(await canInvoke(supabase, provider.name))) continue;
    const model = options.model ?? modelForProviderAndTier(provider.name, modelTier);
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
      if (!isRetryableProviderError(err)) return null;
    }
  }
  return null;
}
