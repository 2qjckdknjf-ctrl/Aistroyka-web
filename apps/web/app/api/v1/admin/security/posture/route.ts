/**
 * GET /api/v1/admin/security/posture — security posture JSON (admin only).
 * Includes: debug flags off in prod, retention policy, SSO enabled, last 30d critical alerts count.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getServerConfig } from "@/lib/config/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  if (!authorize(ctx, "admin:read")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const config = getServerConfig();
  const debugEnabled = Boolean(
    process.env.DEBUG_AUTH === "true" || process.env.DEBUG_DIAG === "true"
  );
  const supabase = await createClient();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const { count } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("severity", "critical")
    .gte("created_at", start.toISOString());
  const { data: idp } = await supabase
    .from("identity_providers")
    .select("tenant_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("enabled", true)
    .maybeSingle();
  const { data: retention } = await supabase
    .from("data_retention_policies")
    .select("media_retention_days")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  const posture = {
    debug_enabled_in_prod: config.NODE_ENV === "production" && debugEnabled,
    retention_policy_days: (retention as { media_retention_days?: number } | null)?.media_retention_days ?? null,
    sso_enabled: Boolean(idp),
    critical_alerts_last_30d: count ?? 0,
  };
  return NextResponse.json(posture);
}
