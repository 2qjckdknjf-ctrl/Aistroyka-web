import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { getPlatformOverviewSnapshot } from "@/lib/platform/platform-overview.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Owner console is not configured." }, { status: 503 });
  }

  const snapshot = await getPlatformOverviewSnapshot(admin);
  if (!snapshot.connected) {
    return NextResponse.json({ error: "Unable to load platform overview." }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      totalTenants: snapshot.totalTenants ?? 0,
      activeUsers: snapshot.activeUsers ?? 0,
      pendingInvites: snapshot.pendingInvites ?? 0,
      openSupportEvents: snapshot.openSupportEvents ?? 0,
      recentSupportEvents: snapshot.recentSupportEvents ?? [],
    },
  });
}
