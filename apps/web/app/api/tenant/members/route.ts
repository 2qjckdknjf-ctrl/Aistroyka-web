import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "tenant:invite")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const supabase = await createClient();
  const tenantId = ctx.tenantId;

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", tenantId)
    .single();

  const { data: rows } = await supabase
    .from("tenant_members")
    .select("user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  const members = (rows ?? []).map((r) => ({
    user_id: r.user_id,
    role: r.role,
    created_at: r.created_at,
    is_owner: tenantRow?.user_id === r.user_id,
  }));

  return NextResponse.json({ data: members });
}
