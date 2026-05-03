import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/alerts/:id/resolve
 * Marks alert as resolved for current tenant (admin write).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const adminErr = requireAdmin(ctx, "write");
  if (adminErr) return adminErr;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
  }

  const supabase = await createClient();
  const resolvedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .update({ resolved_at: resolvedAt })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .is("resolved_at", null)
    .select("id, resolved_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Alert not found or already resolved" }, { status: 404 });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    action: "alert_resolved",
    resource_type: "alert",
    resource_id: id,
    details: { resolved_at: resolvedAt },
  });

  return NextResponse.json({ success: true, data });
}
