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

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId")?.trim() ?? "";
  const inviteToken = url.searchParams.get("inviteToken")?.trim() ?? "";

  let userMemberships: unknown[] = [];
  let inviteStatus: { exists: boolean; expired?: boolean; tenantId?: string | null; email?: string | null } = { exists: false };

  if (userId) {
    const [{ data: membershipsRaw }, { data: ownerTenantRaw }] = await Promise.all([
      admin
        .from("tenant_members")
        .select("tenant_id, role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      admin.from("tenants").select("id, name").eq("user_id", userId),
    ]);
    const memberships = (membershipsRaw ?? []) as Array<{ tenant_id: string; role: string; created_at: string | null }>;
    const ownerTenant = (ownerTenantRaw ?? []) as Array<{ id: string; name: string | null }>;
    const mappedMemberships = memberships.map((m) => ({
      tenant_id: m.tenant_id,
      role: m.role,
      created_at: m.created_at,
      owner: false,
    }));
    const mappedOwnerTenants = ownerTenant.map((t) => ({
        tenant_id: t.id,
        role: "owner",
        created_at: null,
        owner: true,
        tenant_name: t.name,
      }));
    userMemberships = [...mappedMemberships, ...mappedOwnerTenants];
  }

  if (inviteToken) {
    const { data: inviteRaw } = await admin
      .from("tenant_invitations")
      .select("id, tenant_id, email, expires_at, role")
      .eq("token", inviteToken)
      .maybeSingle();
    const invite = inviteRaw as
      | { id: string; tenant_id: string; email: string | null; expires_at: string; role: string }
      | null;
    if (invite?.id) {
      inviteStatus = {
        exists: true,
        tenantId: invite.tenant_id,
        email: invite.email,
        expired: new Date(invite.expires_at) < new Date(),
      };
    }
  }

  const mobileLinks = {
    APP_STORE_WORKER_URL: process.env.APP_STORE_WORKER_URL?.trim() || null,
    GOOGLE_PLAY_WORKER_URL: process.env.GOOGLE_PLAY_WORKER_URL?.trim() || null,
    APP_STORE_MANAGER_URL: process.env.APP_STORE_MANAGER_URL?.trim() || null,
    GOOGLE_PLAY_MANAGER_URL: process.env.GOOGLE_PLAY_MANAGER_URL?.trim() || null,
  };

  return NextResponse.json({
    data: {
      auth: {
        userId: auth.userId,
        role: auth.role,
      },
      membership: {
        lookupUserId: userId || null,
        memberships: userMemberships,
      },
      inviteToken: {
        lookupTokenProvided: Boolean(inviteToken),
        ...inviteStatus,
      },
      mobileLinks,
    },
  });
}
