import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const q = url.searchParams.get("q")?.trim();

  const supabase = await createClientFromRequest(request);
  let query = supabase
    .from("jobs")
    .select("id, type, status, payload, attempts, last_error, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", ctx.tenantId!)
    .in("type", AI_JOB_TYPES)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const fetchLimit = q ? Math.min(200, 200) : limit;
  const fetchOffset = q ? 0 : offset;
  const { data: rows, error, count } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let list = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    entity: (r.payload as { report_id?: string; media_id?: string })?.report_id ?? (r.payload as { media_id?: string })?.media_id ?? null,
    attempts: r.attempts,
    last_error: r.last_error ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  if (q) {
    const qLower = q.toLowerCase();
    list = list.filter(
      (item) =>
        String(item.id).toLowerCase().startsWith(qLower) ||
        String(item.id).toLowerCase().includes(qLower) ||
        (item.entity && String(item.entity).toLowerCase().includes(qLower))
    );
  }
  const total = q ? list.length : (count ?? 0);
  const paginated = q ? list.slice(0, limit) : list;
  return NextResponse.json({ data: paginated, total });
}
