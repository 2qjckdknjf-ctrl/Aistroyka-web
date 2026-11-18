/**
 * GET /api/v1/platform/billing/pilot-status?workspaceId=...
 * Internal: workspace-scoped billing pilot diagnostics (Step 18).
 * Platform owner only. No secrets.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { getBillingPilotDiagnostics } from "@/lib/platform/billing-readiness/billing-pilot-resolution.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

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
