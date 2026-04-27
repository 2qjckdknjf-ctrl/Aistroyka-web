/**
 * DELETE /api/v1/admin/billing/pilot-workspaces/:workspaceId
 * Internal: remove workspace from pilot cohort (Step 19). Admin only.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { removeWorkspaceFromPilotCohort } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "write");
  if (adminErr) return adminErr;

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
