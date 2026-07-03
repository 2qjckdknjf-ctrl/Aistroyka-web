/**
 * POST /api/v1/platform/billing/reprocess-workspace-events
 * Internal: reprocess pending/failed billing events for workspace (Step 19). Platform owner only.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { reprocessBillingEventsForWorkspaceOps } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: { workspaceId: string; includeFailed?: boolean; limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const limit = Math.min(body.limit ?? 50, 100);

  const results = await reprocessBillingEventsForWorkspaceOps(admin, workspaceId, {
    includeFailed: body.includeFailed ?? true,
    limit,
  });

  const processed = results.filter((r) => r.status === "processed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const noop = results.filter((r) => r.status === "noop").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({
    ok: true,
    total: results.length,
    processed,
    failed,
    noop,
    skipped,
    results: results.map((r) => ({ eventId: r.eventId, status: r.status, idempotentHit: r.idempotentHit })),
  });
}
