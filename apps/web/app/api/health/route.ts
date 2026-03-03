/**
 * Readiness/health check for the unified system (site + engine + AI).
 * GET /api/health → { ok, db, aiConfigured, openaiConfigured?, reason? }.
 * - aiConfigured: AI_ANALYSIS_URL is set (job processor can call AI).
 * - openaiConfigured: OPENAI_API_KEY is set (in-app /api/ai/analyze-image can run).
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
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tenants").select("id").limit(1);
    if (error) {
      reason = error.message ?? "db_error";
      db = "error";
    } else {
      db = "ok";
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    reason = message.includes("Missing Supabase env") ? "missing_supabase_env" : "db_error";
  }

  const ok = db === "ok";
  const status = ok ? 200 : 503;
  const body: Record<string, unknown> = { ok, db, aiConfigured, openaiConfigured };
  if (reason) body.reason = reason;
  if (!ok && reason === "missing_supabase_env") {
    body.message = "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example).";
  }

  return NextResponse.json(body, { status });
}
