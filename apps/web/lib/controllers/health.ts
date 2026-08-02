/**
 * Shared health check logic. Used by GET /api/health and GET /api/v1/health.
 * Uses URL + anon key only for DB check (no cookies) so it works in Edge/Workers.
 */

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, getPublicConfig } from "@/lib/config";
import { getServerConfig } from "@/lib/config/server";
import {
  isReleaseStampRequired,
  resolveBuildStamp,
  toHealthBuildStamp,
} from "@/lib/config/build-stamp";

export type HealthBody = Record<string, unknown>;

function isRlsAccessError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const message = maybeMessage.toLowerCase();
  return (
    maybeCode === "42501" ||
    message.includes("permission denied") ||
    message.includes("insufficient privilege") ||
    message.includes("row-level security")
  );
}

/**
 * Read-only OpenAPI probe for rate-limit multi RPC presence.
 * Does not call the RPC (no counter increments).
 */
export async function probeRateLimitRpcStatus(
  supabaseUrl: string,
  anonOrServiceKey: string
): Promise<"present" | "missing" | "unknown"> {
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: anonOrServiceKey,
        Authorization: `Bearer ${anonOrServiceKey}`,
        Accept: "application/openapi+json",
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return "unknown";
    const text = await res.text();
    if (text.includes("rate_limit_try_increment_multi")) return "present";
    return "missing";
  } catch {
    return "unknown";
  }
}

export async function getHealthResponse(): Promise<{ body: HealthBody; status: number }> {
  const serverConfig = getServerConfig();
  const aiConfigured = serverConfig.AI_ANALYSIS_URL.length > 0;
  const openaiConfigured = serverConfig.OPENAI_API_KEY.length > 0;
  const stampResolved = resolveBuildStamp(process.env);
  const stamp = toHealthBuildStamp(stampResolved);
  const stampRequired = isReleaseStampRequired(process.env);

  if (!hasSupabaseEnv()) {
    return {
      body: {
        ok: false,
        db: "error",
        aiConfigured,
        openaiConfigured,
        reason: "missing_supabase_env",
        message:
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).",
        releaseStampRequired: stampRequired,
        releaseStampPresent: Boolean(stamp),
      },
      status: 503,
    };
  }

  let db: "ok" | "error" = "error";
  let reason: string | undefined;
  let supabaseReachable = false;
  const publicConfig = getPublicConfig();
  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = publicConfig;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("tenants").select("id").limit(1);
    if (error) {
      if (isRlsAccessError(error)) {
        db = "ok";
        supabaseReachable = true;
        reason = "rls_restricted";
      } else {
        reason = error.message ?? "db_error";
        db = "error";
      }
    } else {
      db = "ok";
      supabaseReachable = true;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    reason = message.includes("Missing Supabase env") ? "missing_supabase_env" : "db_error";
    if (hasSupabaseEnv()) {
      try {
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

  // Prefer service role for OpenAPI completeness; never log the key.
  const rateLimitProbeKey =
    serverConfig.SUPABASE_SERVICE_ROLE_KEY || publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rateLimitRpcStatus = await probeRateLimitRpcStatus(
    publicConfig.NEXT_PUBLIC_SUPABASE_URL,
    rateLimitProbeKey
  );

  const appEnv =
    (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase() ||
    (process.env.NODE_ENV ?? "").trim().toLowerCase();

  const visionProvidersConfigured = [
    serverConfig.OPENAI_API_KEY.length > 0 ? "openai" : null,
    (process.env.ANTHROPIC_API_KEY ?? "").trim().length > 0 ? "anthropic" : null,
    (process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "").trim().length > 0
      ? "gemini"
      : null,
  ].filter(Boolean);

  let aiOperationalStatus: "unknown" | "configured_unverified" | "degraded" =
    visionProvidersConfigured.length > 0 || aiConfigured ? "configured_unverified" : "unknown";
  if (rateLimitRpcStatus === "missing") {
    aiOperationalStatus = "degraded";
  }

  const stampMissingForRelease = stampRequired && !stamp;
  let ok = db === "ok" && !stampMissingForRelease;
  let status = ok ? 200 : 503;
  if (stampMissingForRelease) {
    reason = "missing_build_stamp";
  }

  const body: HealthBody = {
    ok,
    db,
    aiConfigured,
    openaiConfigured,
    supabaseReachable,
    serviceRoleConfigured: serverConfig.SUPABASE_SERVICE_ROLE_KEY.length > 0,
    visionProvidersConfigured,
    aiOperationalStatus,
    aiLastVerifiedSuccessAt: null,
    rateLimitRpcStatus,
    releaseStampRequired: stampRequired,
    releaseStampPresent: Boolean(stamp),
    ...(appEnv ? { env: appEnv } : {}),
    ...(stamp ? { buildStamp: stamp } : {}),
  };
  if (reason) body.reason = reason;
  if (!ok && reason === "missing_supabase_env") {
    body.message =
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).";
  }
  if (!ok && reason === "missing_build_stamp") {
    body.message =
      "Staging/production require NEXT_PUBLIC_BUILD_SHA and NEXT_PUBLIC_BUILD_TIME (immutable deploy stamp).";
  }
  return { body, status };
}
