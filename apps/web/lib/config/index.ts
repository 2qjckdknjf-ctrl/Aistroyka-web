/**
 * Env governance (B2.2):
 * - `lib/config` is the canonical **declaration and validation** layer for the env contract
 *   (public, server, debug, release checks).
 * - Direct `process.env` elsewhere is **allowed only** for: debug/UI toggles, local infra/bootstrap
 *   glue (e.g. middleware, Supabase session bootstrap), and provider adapters that read secrets.
 * - **New** feature/business logic should prefer helpers here (e.g. getServerConfig, getPublicConfig)
 *   or extend this module rather than adding new ad-hoc env reads.
 */

export {
  getPublicConfig,
  hasSupabaseEnv,
  getBuildStamp,
  type PublicConfig,
} from "./public";

export {
  getServerConfig,
  isOpenAIConfigured,
  isAiJobConfigured,
  type ServerConfig,
} from "./server";

export {
  getDebugConfig,
  isDebugAuthAllowed,
  isDebugDiagAllowed,
  isDebugAllowedForRequest,
  isProductionDebugSafe,
  type DebugConfig,
} from "./debug";

export {
  validateReleaseEnv,
  type ReleaseEnvReport,
  type EnvValidationResult,
  type EnvVarSpec,
  type EnvCategory,
} from "./release-env";

export { validateEnv, type EnvCheckResult } from "./env";
