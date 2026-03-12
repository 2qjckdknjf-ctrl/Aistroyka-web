/**
 * Central config. No file outside lib/config should use process.env for app config.
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
