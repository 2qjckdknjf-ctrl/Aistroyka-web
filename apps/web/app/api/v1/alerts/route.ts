/**
 * GET /api/v1/alerts — tenant-scoped alerts for dashboard (workflow, AI, platform).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listAlerts } from "@/lib/sre/alert.service";

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
  const url = new URL(request.url);
  const unresolvedOnly = url.searchParams.get("unresolved") === "true";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
  const supabase = await createClient();
  const data = await listAlerts(supabase, {
    tenantId: ctx.tenantId!,
    unresolvedOnly,
    limit,
  });
  return NextResponse.json({ data });
}
