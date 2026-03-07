/**
 * Shared health check logic. Used by GET /api/health and GET /api/v1/health.
 * Uses URL + anon key only for DB check (no cookies) so it works in Edge/Workers.
 */

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, getPublicConfig, getBuildStamp } from "@/lib/config";
import { getServerConfig } from "@/lib/config/server";

export type HealthBody = Record<string, unknown>;

export async function getHealthResponse(): Promise<{ body: HealthBody; status: number }> {
  const serverConfig = getServerConfig();
  const aiConfigured = serverConfig.AI_ANALYSIS_URL.length > 0;
  const openaiConfigured = serverConfig.OPENAI_API_KEY.length > 0;

  if (!hasSupabaseEnv()) {
    return {
      body: {
        ok: false,
        db: "error",
        aiConfigured,
        openaiConfigured,
        reason: "missing_supabase_env",
        message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).",
      },
      status: 503,
    };
  }

  let db: "ok" | "error" = "error";
  let reason: string | undefined;
  let supabaseReachable = false;
  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getPublicConfig();
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("tenants").select("id").limit(1);
    if (error) {
      reason = error.message ?? "db_error";
      db = "error";
    } else {
      db = "ok";
      supabaseReachable = true;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    reason = message.includes("Missing Supabase env") ? "missing_supabase_env" : "db_error";
    if (hasSupabaseEnv()) {
      try {
        const publicConfig = getPublicConfig();
        const u = new URL(publicConfig.NEXT_PUBLIC_SUPABASE_URL);
        const res = await fetch(u.origin + "/", {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        supabaseReachable = res.ok || res.status < 500;
      } catch {
        /* leave false */
      }
    }
  }

  const ok = db === "ok";
  const status = ok ? 200 : 503;
  const { sha, buildTime } = getBuildStamp();
  const serviceRoleConfigured = serverConfig.SUPABASE_SERVICE_ROLE_KEY.length > 0;
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  const body: HealthBody = {
    ok,
    db,
    aiConfigured,
    openaiConfigured,
    supabaseReachable,
    serviceRoleConfigured,
    ...(appEnv ? { env: appEnv } : {}),
    buildStamp: sha ? { sha7: sha.slice(0, 7), buildTime } : undefined,
  };
  if (reason) body.reason = reason;
  if (!ok && reason === "missing_supabase_env") {
    body.message = "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).";
  }
  return { body, status };
}
