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

export async function PATCH(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const adminErr = requireAdmin(ctx, "write");
  if (adminErr) return adminErr;

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: "Too many ids (max 100)" }, { status: 400 });
  }
  const resolvedAt = body.resolved === false ? null : new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anomalies")
    .update({ resolved_at: resolvedAt })
    .eq("tenant_id", ctx.tenantId)
    .in("id", ids)
    .select("id, resolved_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: data?.length ?? 0, data: data ?? [] });
}
