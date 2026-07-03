import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }
  const db = admin as any;

  const [tenants, members, tenantOwners, pendingInvites, openSupport, unresolvedSupport] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }),
    admin.from("tenant_members").select("user_id"),
    admin.from("tenants").select("user_id"),
    admin
      .from("tenant_invitations")
      .select("id", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString()),
    db
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "waiting_user"]),
    db
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, tenant_id")
      .in("status", ["open", "in_progress", "waiting_user"])
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);
  const memberRows = (members.data ?? []) as Array<{ user_id: string }>;
  const ownerRows = (tenantOwners.data ?? []) as Array<{ user_id: string | null }>;

  return NextResponse.json({
    data: {
      totalTenants: tenants.count ?? 0,
      activeUsers: new Set([
        ...memberRows.map((row) => row.user_id),
        ...ownerRows.map((row) => row.user_id).filter(Boolean),
      ]).size,
      pendingInvites: pendingInvites.count ?? 0,
      openSupportEvents: openSupport.count ?? 0,
      recentSupportEvents: unresolvedSupport.data ?? [],
    },
  });
}
