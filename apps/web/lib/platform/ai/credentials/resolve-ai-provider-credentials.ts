/**
 * AI provider credential resolution (Codex/Cursor delta 2026-11-24 D3b).
 * Resolution order:
 * 1) Optional per-tenant map from `AI_TENANT_PROVIDER_KEYS_JSON` (owner-managed secret)
 * 2) Global process env keys
 * Full KMS/Supabase vault remains a later hardening step.
 */

export type AiProviderName = "openai" | "anthropic" | "gemini";

export type AiProviderCredentialSource = "tenant_env_map" | "global_env" | "missing";

export type AiProviderCredentials = {
  provider: AiProviderName;
  apiKey: string | null;
  source: AiProviderCredentialSource;
  tenantScoped: boolean;
  rotationHint: "use_tenant_map_rotation" | "use_global_env_rotation" | "missing";
};

type TenantKeyMap = Record<string, Partial<Record<AiProviderName, string>>>;

function readGlobalKey(provider: AiProviderName, env: NodeJS.ProcessEnv): string | null {
  switch (provider) {
    case "openai": {
      const key = (env.OPENAI_API_KEY ?? "").trim();
      return key || null;
    }
    case "anthropic": {
      const key = (env.ANTHROPIC_API_KEY ?? "").trim();
      return key || null;
    }
    case "gemini": {
      const key = (env.GOOGLE_AI_API_KEY ?? env.GEMINI_API_KEY ?? "").trim();
      return key || null;
    }
    default: {
      const _exhaustive: never = provider;
      void _exhaustive;
      return null;
    }
  }
}

/** Parse owner-managed JSON map: { "<tenantId>": { "openai"|"anthropic"|"gemini": "<key>" } } */
export function parseTenantProviderKeyMap(raw: string | null | undefined): TenantKeyMap | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as TenantKeyMap;
  } catch {
    return null;
  }
}

function readTenantKey(
  provider: AiProviderName,
  tenantId: string | null,
  env: NodeJS.ProcessEnv
): string | null {
  if (!tenantId) return null;
  const map = parseTenantProviderKeyMap(env.AI_TENANT_PROVIDER_KEYS_JSON);
  if (!map) return null;
  const entry = map[tenantId];
  if (!entry || typeof entry !== "object") return null;
  const key = entry[provider];
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  return trimmed || null;
}

/**
 * Resolve credentials for a provider. Prefer tenant map when present, else global env.
 */
export function resolveAiProviderCredentials(
  provider: AiProviderName,
  tenantId: string | null = null,
  env: NodeJS.ProcessEnv = process.env
): AiProviderCredentials {
  const tenantKey = readTenantKey(provider, tenantId, env);
  if (tenantKey) {
    return {
      provider,
      apiKey: tenantKey,
      source: "tenant_env_map",
      tenantScoped: true,
      rotationHint: "use_tenant_map_rotation",
    };
  }
  const apiKey = readGlobalKey(provider, env);
  if (!apiKey) {
    return {
      provider,
      apiKey: null,
      source: "missing",
      tenantScoped: false,
      rotationHint: "missing",
    };
  }
  return {
    provider,
    apiKey,
    source: "global_env",
    tenantScoped: false,
    rotationHint: "use_global_env_rotation",
  };
}
