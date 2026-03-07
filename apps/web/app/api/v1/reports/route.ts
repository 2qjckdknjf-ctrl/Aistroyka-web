import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listReportsWithMetadata } from "@/lib/domain/reports/report-list.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/reports — list reports (tenant-scoped). Query: project_id, from, to, limit, status. Enriches with media_count and analysis_status. */
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
  const userId = url.searchParams.get("worker_id") ?? url.searchParams.get("user_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const statusFilter = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const supabase = await createClient();
  const { data, error } = await listReportsWithMetadata(supabase, ctx, {
    projectId,
    userId,
    from,
    to,
    limit,
    q,
    statusFilter,
  });

  if (error) {
    return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 400 });
  }

  return NextResponse.json({ data });
}
