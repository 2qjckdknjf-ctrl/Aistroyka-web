/**
 * GET /api/v1/admin/anomalies?range=30d&resolved=false
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { listAnomalies } from "@/lib/platform/anomaly/anomaly.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;
  const url = new URL(request.url);
  const range = url.searchParams.get("range") ?? "30d";
  const rangeDays = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const resolvedParam = url.searchParams.get("resolved");
  const resolved = resolvedParam === "false" ? false : resolvedParam === "true" ? true : undefined;
  const supabase = await createClient();
  const data = await listAnomalies(supabase, ctx.tenantId, rangeDays, resolved);
  return NextResponse.json({ data, range: `${rangeDays}d` });
}
