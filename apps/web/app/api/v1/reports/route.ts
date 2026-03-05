import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listReportsForManager } from "@/lib/domain/reports/report-list.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/reports — list reports (tenant-scoped). Query: project_id, from, to, limit. */
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
  const projectId = url.searchParams.get("project_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const supabase = await createClient();
  const data = await listReportsForManager(supabase, ctx.tenantId!, {
    projectId,
    from,
    to,
    limit,
  });
  return NextResponse.json({ data });
}
