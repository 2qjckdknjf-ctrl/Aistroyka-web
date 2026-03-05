/**
 * Server-only config. Never expose to client.
 * OPENAI, AI job, Supabase service role, timeouts, retries.
 */

export interface ServerConfig {
  OPENAI_API_KEY: string;
  OPENAI_VISION_MODEL: string;
  OPENAI_VISION_TIMEOUT_MS: number;
  OPENAI_RETRY_ON_5XX: number;
  /** Anthropic (optional). When set, Anthropic can be used as vision provider. */
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_VISION_MODEL: string;
  /** Google AI / Gemini (optional). Prefer GOOGLE_AI_API_KEY; fallback GEMINI_API_KEY. */
  GOOGLE_AI_API_KEY: string;
  GEMINI_VISION_MODEL: string;
  AI_ANALYSIS_URL: string;
  AI_REQUEST_TIMEOUT_MS: number;
  AI_RETRY_ATTEMPTS: number;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: string;
}

function numEnv(name: string, defaultVal: number, min: number, max: number): number {
  const v = Number(process.env[name]);
  if (!Number.isFinite(v)) return defaultVal;
  return Math.min(max, Math.max(min, v));
}

export function getServerConfig(): ServerConfig {
  const googleKey = (process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "").trim();
  return {
    OPENAI_API_KEY: (process.env.OPENAI_API_KEY ?? "").trim(),
    OPENAI_VISION_MODEL: (process.env.OPENAI_VISION_MODEL ?? "gpt-4o").trim() || "gpt-4o",
    OPENAI_VISION_TIMEOUT_MS: numEnv("OPENAI_VISION_TIMEOUT_MS", 85_000, 30_000, 120_000),
    OPENAI_RETRY_ON_5XX: Math.min(3, Math.max(0, Number(process.env.OPENAI_RETRY_ON_5XX) ?? 1)),
    ANTHROPIC_API_KEY: (process.env.ANTHROPIC_API_KEY ?? "").trim(),
    ANTHROPIC_VISION_MODEL: (process.env.ANTHROPIC_VISION_MODEL ?? "claude-3-5-sonnet-20241022").trim() || "claude-3-5-sonnet-20241022",
    GOOGLE_AI_API_KEY: googleKey,
    GEMINI_VISION_MODEL: (process.env.GEMINI_VISION_MODEL ?? process.env.GOOGLE_AI_VISION_MODEL ?? "gemini-1.5-flash").trim() || "gemini-1.5-flash",
    AI_ANALYSIS_URL: (process.env.AI_ANALYSIS_URL ?? "").trim(),
    AI_REQUEST_TIMEOUT_MS: numEnv("AI_REQUEST_TIMEOUT_MS", 90_000, 30_000, 120_000),
    AI_RETRY_ATTEMPTS: Math.min(5, Math.max(1, Number(process.env.AI_RETRY_ATTEMPTS) || 3)),
    SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

export function isOpenAIConfigured(): boolean {
  return getServerConfig().OPENAI_API_KEY.length > 0;
}

/** True if at least one vision provider (OpenAI, Anthropic, Gemini) is configured. */
export function isAnyVisionProviderConfigured(): boolean {
  const c = getServerConfig();
  return c.OPENAI_API_KEY.length > 0 || c.ANTHROPIC_API_KEY.length > 0 || c.GOOGLE_AI_API_KEY.length > 0;
}

export function isAiJobConfigured(): boolean {
  const c = getServerConfig();
  return c.AI_ANALYSIS_URL.length > 0 && c.SUPABASE_SERVICE_ROLE_KEY.length > 0;
}
