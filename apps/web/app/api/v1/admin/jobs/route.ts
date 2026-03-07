import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getFailedJobs } from "@/lib/observability/metrics.service";

export const dynamic = "force-dynamic";

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
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // e.g. failed
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  const supabase = await createClient();
  const rows = await getFailedJobs(supabase, ctx.tenantId!, limit);

  // Filter by status if provided (business logic moved to service would be better, but this is minor)
  const filtered = status ? rows.filter((r) => r.status === status) : rows;

  return NextResponse.json({ data: filtered });
}
