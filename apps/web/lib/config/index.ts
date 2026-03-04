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
  type DebugConfig,
} from "./debug";
