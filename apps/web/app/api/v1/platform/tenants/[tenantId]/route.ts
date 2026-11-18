import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ tenantId: string }> }
) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const { tenantId } = await context.params;
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }

  const [{ data: tenant }, { data: members }, { data: invitations }, { data: projects }] = await Promise.all([
    admin.from("tenants").select("id, name, user_id, plan, created_at").eq("id", tenantId).maybeSingle(),
    admin
      .from("tenant_members")
      .select("user_id, role, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
    admin
      .from("tenant_invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    admin
      .from("projects")
      .select("id, name, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!tenant) return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  return NextResponse.json({
    data: {
      tenant,
      members: members ?? [],
      invitations: invitations ?? [],
      projects: projects ?? [],
    },
  });
}
