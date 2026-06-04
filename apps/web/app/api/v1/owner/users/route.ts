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

  const { data: membersRaw, error } = await admin
    .from("tenant_members")
    .select("tenant_id, user_id, role, created_at")
    .order("created_at", { ascending: false })
    .limit(limit * 4);
  if (error) return NextResponse.json({ error: "Unable to load users." }, { status: 500 });

  const members = (membersRaw ?? []) as Array<{ tenant_id: string; user_id: string; role: string }>;
  const grouped = new Map<string, { userId: string; memberships: { tenant_id: string; role: string }[] }>();
  for (const member of members) {
    const existing = grouped.get(member.user_id) ?? { userId: member.user_id, memberships: [] };
    existing.memberships.push({ tenant_id: member.tenant_id, role: member.role });
    grouped.set(member.user_id, existing);
  }

  const userIds = Array.from(grouped.keys()).slice(0, limit);
  if (userIds.length === 0) {
    return NextResponse.json({ data: [] });
  }
  const grantsRes = await admin
    .from("platform_owner_grants")
    .select("user_id, role")
    .in("user_id", userIds);
  const grantByUser = new Map<string, string>();
  const grants = (grantsRes.data ?? []) as Array<{ user_id: string; role: string }>;
  for (const grant of grants) {
    grantByUser.set(grant.user_id, grant.role);
  }

  const users = Array.from(grouped.values())
    .filter((u) => {
      if (!search) return true;
      return u.userId.toLowerCase().includes(search) || u.memberships.some((m) => m.tenant_id.toLowerCase().includes(search));
    })
    .slice(0, limit)
    .map((user) => ({
      userId: user.userId,
      memberships: user.memberships,
      platformOwnerGrant: grantByUser.get(user.userId) ?? null,
    }));

  return NextResponse.json({ data: users });
}
