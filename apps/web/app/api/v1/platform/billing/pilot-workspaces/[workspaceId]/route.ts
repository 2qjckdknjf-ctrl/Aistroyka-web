/**
 * DELETE /api/v1/platform/billing/pilot-workspaces/:workspaceId
 * Internal: remove workspace from pilot cohort (Step 19). Platform owner only.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { removeWorkspaceFromPilotCohort } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { workspaceId } = await params;
  if (!workspaceId?.trim()) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const { error } = await removeWorkspaceFromPilotCohort(admin, workspaceId);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
