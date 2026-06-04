import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const search = url.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }

  const { data: tenantsRaw, error } = await admin
    .from("tenants")
    .select("id, name, user_id, created_at, plan")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: "Unable to load tenants." }, { status: 500 });

  const tenants = (tenantsRaw ?? []) as Array<{
    id: string;
    name: string | null;
    user_id: string | null;
    created_at: string;
    plan: string | null;
  }>;
  const filtered = tenants.filter((tenant) => {
    if (!search) return true;
    return (
      tenant.id.toLowerCase().includes(search) ||
      (tenant.name ?? "").toLowerCase().includes(search) ||
      (tenant.user_id ?? "").toLowerCase().includes(search)
    );
  });

  const tenantIds = filtered.map((t) => t.id);
  if (tenantIds.length === 0) {
    return NextResponse.json({ data: [] });
  }
  const [membersRes, invitesRes, projectsRes] = await Promise.all([
    admin.from("tenant_members").select("tenant_id").in("tenant_id", tenantIds),
    admin
      .from("tenant_invitations")
      .select("tenant_id")
      .in("tenant_id", tenantIds)
      .gt("expires_at", new Date().toISOString()),
    admin.from("projects").select("tenant_id").in("tenant_id", tenantIds),
  ]);

  const memberCounts = new Map<string, number>();
  const inviteCounts = new Map<string, number>();
  const projectCounts = new Map<string, number>();
  const memberRows = (membersRes.data ?? []) as Array<{ tenant_id: string }>;
  const inviteRows = (invitesRes.data ?? []) as Array<{ tenant_id: string }>;
  const projectRows = (projectsRes.data ?? []) as Array<{ tenant_id: string }>;
  for (const row of memberRows) {
    memberCounts.set(row.tenant_id, (memberCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of inviteRows) {
    inviteCounts.set(row.tenant_id, (inviteCounts.get(row.tenant_id) ?? 0) + 1);
  }
  for (const row of projectRows) {
    projectCounts.set(row.tenant_id, (projectCounts.get(row.tenant_id) ?? 0) + 1);
  }

  return NextResponse.json({
    data: filtered.map((tenant) => ({
      ...tenant,
      membersCount: memberCounts.get(tenant.id) ?? 0,
      invitationsCount: inviteCounts.get(tenant.id) ?? 0,
      projectsCount: projectCounts.get(tenant.id) ?? 0,
    })),
  });
}
