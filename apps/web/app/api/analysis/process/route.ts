import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerConfig } from "@/lib/config/server";
import { processOneJob } from "@/lib/ai/runOneJob";
import { withRequestIdAndTiming } from "@/lib/observability";

const ROUTE_KEY = "POST /api/analysis/process";

/**
 * Process one analysis job (dequeue → AI → complete).
 * Call this after upload or from polling so the web app can run the engine without a separate worker.
 * Requires AI_ANALYSIS_URL and SUPABASE_SERVICE_ROLE_KEY in env. Authenticated user required.
 * Uses service_role for job RPCs so RLS/EXECUTE revokes on anon/authenticated do not break this route.
 */
export async function POST(request: Request) {
  const start = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return withRequestIdAndTiming(request, NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
  }

  const admin = getAdminClient();
  if (!admin) {
    return withRequestIdAndTiming(request, NextResponse.json(
      {
        ok: false,
        error: "Job processing requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.",
      },
      { status: 503 }
    ), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
  }

  const aiUrl = getServerConfig().AI_ANALYSIS_URL || undefined;
  const traceId = request.headers.get("x-request-id")?.trim() || undefined;
  const result = await processOneJob(admin, aiUrl, { traceId });

  if (!result.ok) {
    if (result.reason === "no_url") {
      return withRequestIdAndTiming(request, NextResponse.json(
        { ok: false, error: "AI_ANALYSIS_URL is not configured" },
        { status: 503 }
      ), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
    }
    if (result.reason === "no_job") {
      return withRequestIdAndTiming(request, NextResponse.json({ ok: true, processed: false }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
    }
    return withRequestIdAndTiming(request, NextResponse.json(
      { ok: false, error: result.message ?? "Processing failed" },
      { status: 500 }
    ), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
  }

  return withRequestIdAndTiming(request, NextResponse.json({
    ok: true,
    processed: true,
    jobId: result.jobId,
    status: result.status,
  }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, userId: user.id });
}
