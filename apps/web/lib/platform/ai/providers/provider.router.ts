/**
 * Router: select provider by tier + circuit state, invoke with fallback.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { canInvoke, recordSuccess, recordFailure } from "./circuit-breaker";
import { openaiProvider } from "./provider.openai";
import { anthropicProvider } from "./provider.anthropic.stub";
import { geminiProvider } from "./provider.gemini.stub";
import type { VisionResult, VisionOptions } from "./provider.interface";

const PROVIDERS = [openaiProvider, anthropicProvider, geminiProvider];

/** Select ordered providers for tier (enterprise may prefer different order). Fallback: openai. */
function providersForTier(_tier: string): typeof PROVIDERS {
  return PROVIDERS;
}

export async function invokeVisionWithRouter(
  supabase: SupabaseClient,
  imageUrl: string,
  options: { tier?: string; model?: string } & VisionOptions
): Promise<VisionResult | null> {
  const tier = options.tier ?? "free";
  const ordered = providersForTier(tier);
  for (const provider of ordered) {
    if (!(await canInvoke(supabase, provider.name))) continue;
    try {
      const result = await provider.invokeVision(imageUrl, {
        model: options.model,
        maxTokens: options.maxTokens,
      });
      if (result) {
        await recordSuccess(supabase, provider.name);
        return result;
      }
    } catch {
      await recordFailure(supabase, provider.name);
    }
  }
  return null;
}
