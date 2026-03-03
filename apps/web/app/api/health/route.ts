/**
 * Readiness/health check for the unified system (site + engine + AI).
 * GET /api/health → { ok, db, aiConfigured, openaiConfigured, supabaseReachable?, buildStamp?: { sha7, buildTime }, reason? }.
 * - aiConfigured: AI_ANALYSIS_URL is set (job processor can call AI).
 * - openaiConfigured: OPENAI_API_KEY is set (in-app /api/ai/analyze-image can run).
 * - supabaseReachable: Supabase URL is reachable (no URL leaked in response).
 * No auth. Used by deploy checks and optional UI hints.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const aiConfigured = Boolean(process.env.AI_ANALYSIS_URL?.trim());
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        aiConfigured,
        openaiConfigured,
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
  const body: Record<string, unknown> = {
    ok,
    db,
    aiConfigured,
    openaiConfigured,
    supabaseReachable,
    buildStamp: sha ? { sha7: sha.slice(0, 7), buildTime } : undefined,
  };
  if (reason) body.reason = reason;
  if (!ok && reason === "missing_supabase_env") {
    body.message = "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).";
  }

  return NextResponse.json(body, { status });
}
