import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
} from "@/lib/tenant";
import {
  normalizeCreatedAtBound,
  presentAIRequestRow,
  visionConfiguredForEnv,
} from "@/lib/platform/ai/ai-request-presentation";

export const dynamic = "force-dynamic";

const AI_JOB_TYPES = ["ai_analyze_media", "ai_analyze_report"];

/** GET /api/v1/ai/requests — list AI jobs (tenant-scoped, paginated). */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    100,
  );
  const offset = Math.max(
    0,
    parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
  );
  const status = url.searchParams.get("status") ?? undefined;
  const from = normalizeCreatedAtBound(
    url.searchParams.get("from") ?? undefined,
    "from",
  );
  const to = normalizeCreatedAtBound(
    url.searchParams.get("to") ?? undefined,
    "to",
  );
  const q = url.searchParams.get("q")?.trim();

  const supabase = await createClientFromRequest(request);

  // Unfiltered summary so UI can distinguish "no AI requests" vs filtered empty / failed jobs.
  const { data: summaryRows } = await supabase
    .from("jobs")
    .select("status")
    .eq("tenant_id", ctx.tenantId!)
    .in("type", AI_JOB_TYPES);

  const summary = {
    total: 0,
    queued: 0,
    running: 0,
    success: 0,
    failed: 0,
    dead: 0,
  };
  for (const row of summaryRows ?? []) {
    const s = (row as { status?: string }).status;
    summary.total += 1;
    if (s === "queued") summary.queued += 1;
    else if (s === "running") summary.running += 1;
    else if (s === "success") summary.success += 1;
    else if (s === "failed") summary.failed += 1;
    else if (s === "dead") summary.dead += 1;
  }

  let query = supabase
    .from("jobs")
    .select(
      "id, type, status, payload, attempts, max_attempts, last_error, last_error_type, created_at, updated_at",
      { count: "exact" },
    )
    .eq("tenant_id", ctx.tenantId!)
    .in("type", AI_JOB_TYPES)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const fetchLimit = q ? Math.min(200, 200) : limit;
  const fetchOffset = q ? 0 : offset;
  const {
    data: rows,
    error,
    count,
  } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);
  if (error)
    return NextResponse.json(
      { error: "Failed to load AI requests" },
      { status: 500 },
    );

  let list = (rows ?? []).map((r) =>
    presentAIRequestRow(r as Parameters<typeof presentAIRequestRow>[0]),
  );

  if (q) {
    const qLower = q.toLowerCase();
    list = list.filter(
      (item) =>
        String(item.id).toLowerCase().startsWith(qLower) ||
        String(item.id).toLowerCase().includes(qLower) ||
        (item.entity && String(item.entity).toLowerCase().includes(qLower)),
    );
  }
  const total = q ? list.length : (count ?? 0);
  const paginated = q ? list.slice(0, limit) : list;
  return NextResponse.json({
    data: paginated,
    total,
    summary,
    vision_configured: visionConfiguredForEnv(),
  });
}
