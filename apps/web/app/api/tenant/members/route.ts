import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 403 });

  if (!(await hasMinRole(supabase, tenantId, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

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
