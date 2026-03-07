import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listWorkersWithLastActivity } from "@/lib/domain/workers/worker-list.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers — list workers with last day/report (tenant-scoped, read-only). */
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 200);
  const supabase = await createClientFromRequest(request);
  const data = await listWorkersWithLastActivity(supabase, ctx.tenantId!, limit);
  return NextResponse.json({ data });
}
