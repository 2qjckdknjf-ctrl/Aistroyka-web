/**
 * Readiness/health check for the unified system (site + engine + AI).
 * GET /api/health → { ok, db, aiConfigured, openaiConfigured, aiConfigMissing?, supabaseReachable?, serviceRoleConfigured?, buildStamp?, reason? }.
 * - openaiConfigured: OPENAI_API_KEY is set (in-app /api/ai/analyze-image can run).
 * - aiConfigured: AI_ANALYSIS_URL is set (job processor can call AI).
 * - aiConfigMissing: names of AI-related env vars that are missing (names only; no values, safe for public response).
 * - supabaseReachable: Supabase URL is reachable (no URL leaked in response).
 * - serviceRoleConfigured: SUPABASE_SERVICE_ROLE_KEY is set (required for job processing after security hardening).
 * No auth. Used by deploy checks and optional UI hints.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

/** AI-related env var names we check. Only names are ever returned; values are never exposed. */
const AI_ENV_NAMES = ["OPENAI_API_KEY", "AI_ANALYSIS_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

function getAiConfigMissing(): string[] {
  return AI_ENV_NAMES.filter((name) => !process.env[name]?.trim());
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const aiConfigured = Boolean(process.env.AI_ANALYSIS_URL?.trim());
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const aiConfigMissing = getAiConfigMissing();

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        aiConfigured,
        openaiConfigured,
        aiConfigMissing,
        reason: "missing_supabase_env",
        message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).",
      },
      { status: 503 }
    );
  }

  let db: "ok" | "error" = "error";
  let reason: string | undefined;
  let supabaseReachable = false;
  try {
    const supabase = await createClient();
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
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA ?? "";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const body: Record<string, unknown> = {
    ok,
    db,
    aiConfigured,
    openaiConfigured,
    aiConfigMissing,
    supabaseReachable,
    serviceRoleConfigured,
    buildStamp: sha ? { sha7: sha.slice(0, 7), buildTime } : undefined,
  };
  if (reason) body.reason = reason;
  if (!ok && reason === "missing_supabase_env") {
    body.message = "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).";
  }

  return NextResponse.json(body, { status });
}
