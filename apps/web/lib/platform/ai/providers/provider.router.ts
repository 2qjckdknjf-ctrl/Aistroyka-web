/**
 * Router: tenant-aware provider order, model tier, circuit breaker, fallback.
 * Provider order from tenant_feature_flags (ai_provider_preference, ai_fallback_enabled).
 * Model from options.model or model tier (lib/platform/ai/routing/models.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { canInvoke, recordSuccess, recordFailure } from "./circuit-breaker";
import { openaiProvider } from "./provider.openai";
import { anthropicProvider } from "./provider.anthropic";
import { geminiProvider } from "./provider.gemini";
import type { VisionResult, VisionOptions } from "./provider.interface";
import { getTenantAIPreferences } from "@/lib/platform/ai/routing/tenant-ai-preferences";
import { modelForProviderAndTier, type ModelTier } from "@/lib/platform/ai/routing/models";

const PROVIDERS = [openaiProvider, anthropicProvider, geminiProvider];
const PROVIDER_BY_NAME = Object.fromEntries(PROVIDERS.map((p) => [p.name, p]));
const ALL_PROVIDER_NAMES = PROVIDERS.map((p) => p.name);

export interface RouterOptions extends VisionOptions {
  tier?: string;
  model?: string;
  tenantId?: string | null;
  requestId?: string | null;
}

/**
 * Operator allowlist (comma-separated). Empty / unset = all built-in providers.
 * Forbidden providers are never invoked (Codex delta 2026-11-24 P0).
 */
export function getProviderAllowlist(): Set<string> {
  const raw = (process.env.AI_PROVIDER_ALLOWLIST ?? "").trim();
  if (!raw) return new Set(ALL_PROVIDER_NAMES);
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALL_PROVIDER_NAMES.includes(s));
  return new Set(allowed.length > 0 ? allowed : ALL_PROVIDER_NAMES);
}

/** Order providers: preferred first (if set), then rest; if fallback disabled, preferred only. */
function orderProviders(
  preference: "openai" | "anthropic" | "gemini" | undefined,
  fallbackEnabled: boolean,
  allowlist: Set<string> = getProviderAllowlist()
): typeof PROVIDERS {
  const eligible = PROVIDERS.filter((p) => allowlist.has(p.name));
  if (eligible.length === 0) return [];
  if (!preference || !PROVIDER_BY_NAME[preference] || !allowlist.has(preference)) {
    return eligible;
  }
  const preferred = PROVIDER_BY_NAME[preference];
  const rest = eligible.filter((p) => p.name !== preference);
  if (!fallbackEnabled) return [preferred];
  return [preferred, ...rest];
}

/** Exported for unit tests. */
export function orderProvidersForTest(
  preference: "openai" | "anthropic" | "gemini" | undefined,
  fallbackEnabled: boolean,
  allowlist?: Set<string>
): typeof PROVIDERS {
  return orderProviders(preference, fallbackEnabled, allowlist ?? getProviderAllowlist());
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
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
      });
      if (result) {
        await recordSuccess(supabase, provider.name);
        return result;
      }
    } catch (err) {
      await recordFailure(supabase, provider.name);
      // Provider-specific failures should not block cross-provider fallback.
      // Continue to the next provider and only fail after the full chain.
      void err;
    }
  }
  return null;
}
