/**
 * Environment validation for production readiness.
 * Checks required and optional vars; no throw, returns result.
 */

import { hasSupabaseEnv } from "./public";
import { getServerConfig } from "./server";

export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_PUBLIC = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const OPTIONAL_SERVER = ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const APP_ENV_KEY = "NEXT_PUBLIC_APP_ENV";

export function validateEnv(): EnvCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!hasSupabaseEnv()) {
    missing.push(...REQUIRED_PUBLIC);
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!key || typeof key !== "string") missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const serverConfig = getServerConfig();
  if (process.env.NODE_ENV === "production" && !serverConfig.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY is unset; some server features may be limited.");
  }
  if (process.env.NODE_ENV === "production" && !serverConfig.OPENAI_API_KEY && !serverConfig.AI_ANALYSIS_URL) {
    warnings.push("Neither OPENAI_API_KEY nor AI_ANALYSIS_URL set; AI features disabled.");
  }

  const appEnv = process.env[APP_ENV_KEY]?.trim().toLowerCase();
  if (!appEnv && process.env.NODE_ENV === "production") {
    warnings.push(`${APP_ENV_KEY} not set; consider setting to 'production' or 'staging'.`);
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
  };
}
