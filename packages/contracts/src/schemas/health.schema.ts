import { z } from "zod";

export const BuildStampSchema = z.object({
  /** First 7 hex chars of immutable commit SHA. */
  sha7: z.string().regex(/^[a-f0-9]{7}$/i),
  buildTime: z.string().min(1),
  /** Optional full 40-char SHA when available. */
  sha: z
    .string()
    .regex(/^[a-f0-9]{40}$/i)
    .optional(),
});

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  db: z.enum(["ok", "error"]),
  /** True when AI_ANALYSIS_URL is set (async job pipeline) — not live vision proof. */
  aiConfigured: z.boolean(),
  /** True when OPENAI_API_KEY is present — configuration only, not operational live proof. */
  openaiConfigured: z.boolean(),
  supabaseReachable: z.boolean().optional(),
  serviceRoleConfigured: z.boolean().optional(),
  /** Provider names with keys present. Never means last-verified live success. */
  visionProvidersConfigured: z.array(z.enum(["openai", "anthropic", "gemini"])).optional(),
  /**
   * Operational classification from configuration only.
   * `configured_unverified` / `unknown` / `degraded` — never `live` from env alone.
   */
  aiOperationalStatus: z.enum(["unknown", "configured_unverified", "degraded"]).optional(),
  /** ISO timestamp of last verified non-fallback product success when available. */
  aiLastVerifiedSuccessAt: z.string().nullable().optional(),
  /** Read-only OpenAPI presence of rate_limit_try_increment_multi. */
  rateLimitRpcStatus: z.enum(["present", "missing", "unknown"]).optional(),
  /** True when NEXT_PUBLIC_APP_ENV is staging|production. */
  releaseStampRequired: z.boolean().optional(),
  releaseStampPresent: z.boolean().optional(),
  env: z.string().optional(),
  buildStamp: BuildStampSchema.optional(),
  reason: z.string().optional(),
  message: z.string().optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
