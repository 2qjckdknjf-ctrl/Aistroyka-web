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

  const { data: rows } = await supabase
    .from("tenant_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: rows ?? [] });
}
