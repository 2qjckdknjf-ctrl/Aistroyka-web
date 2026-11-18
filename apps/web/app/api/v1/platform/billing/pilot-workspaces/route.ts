/**
 * GET /api/v1/platform/billing/pilot-workspaces
 * POST /api/v1/platform/billing/pilot-workspaces
 * Internal: pilot cohort management (Step 19). Platform owner only.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  listBillingPilotWorkspacesSummary,
  addWorkspaceToPilotCohort,
} from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const workspaces = await listBillingPilotWorkspacesSummary(admin, { limit, offset });

  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: { workspaceId: string; liveCheckoutEnabled?: boolean; webhookProcessingEnabled?: boolean; cohortLabel?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(workspaceId)) {
    return NextResponse.json({ error: "workspaceId must be valid UUID" }, { status: 400 });
  }

  const { data, error } = await addWorkspaceToPilotCohort(admin, {
    workspaceId,
    liveCheckoutEnabled: body.liveCheckoutEnabled ?? true,
    webhookProcessingEnabled: body.webhookProcessingEnabled ?? true,
    cohortLabel: body.cohortLabel ?? null,
    notes: body.notes ?? null,
    enabledBy: auth.userId ?? null,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, workspace: data });
}
