import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers/:userId/days — list worker days for a user (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

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
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "31", 10) || 31, 90);

  const supabase = await createClient();
  let query = supabase
    .from("worker_day")
    .select("id, tenant_id, user_id, day_date, started_at, ended_at, created_at")
    .eq("tenant_id", ctx.tenantId!)
    .eq("user_id", userId)
    .order("day_date", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("day_date", from);
  if (to) query = query.lte("day_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
