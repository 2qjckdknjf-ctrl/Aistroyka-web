/**
 * AI provider credential resolution (Codex/Cursor delta 2026-11-24 D3b).
 * Today: global process env only. Tenant-scoped vault / rotation is OWNER_GATE.
 * Callers should use this helper instead of reading env ad hoc so a future
 * tenant broker can land without rewriting every provider.
 */

export type AiProviderName = "openai" | "anthropic" | "gemini";

export type AiProviderCredentialSource = "global_env" | "missing";

export type AiProviderCredentials = {
  provider: AiProviderName;
  apiKey: string | null;
  source: AiProviderCredentialSource;
  /** Always false until tenant vault OWNER_GATE lands. */
  tenantScoped: false;
  rotationHint: "use_global_env_rotation" | "missing";
};

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

/**
 * Resolve credentials for a provider. `tenantId` is accepted for forward
 * compatibility; tenant vault lookup is not implemented (OWNER_GATE).
 */
export function resolveAiProviderCredentials(
  provider: AiProviderName,
  _tenantId: string | null = null,
  env: NodeJS.ProcessEnv = process.env
): AiProviderCredentials {
  void _tenantId;
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
