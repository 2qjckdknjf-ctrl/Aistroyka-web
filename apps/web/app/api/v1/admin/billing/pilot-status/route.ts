/**
 * GET /api/v1/admin/billing/pilot-status?workspaceId=...
 * Internal: workspace-scoped billing pilot diagnostics (Step 18).
 * Admin only. No secrets.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { getBillingPilotDiagnostics } from "@/lib/platform/billing-readiness/billing-pilot-resolution.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId query param required" }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const diagnostics = await getBillingPilotDiagnostics(admin, workspaceId);

  return NextResponse.json(diagnostics);
}
