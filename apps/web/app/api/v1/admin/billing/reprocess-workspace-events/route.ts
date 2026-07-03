/**
 * POST /api/v1/admin/billing/reprocess-workspace-events
 * Internal: reprocess pending/failed billing events for workspace (Step 19). Admin only.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { requirePlatformOwnerLegacyAdminRoute } from "@/lib/api/require-platform-admin-legacy-route";
import { getAdminClient } from "@/lib/supabase/admin";
import { reprocessBillingEventsForWorkspaceOps } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const platformErr = await requirePlatformOwnerLegacyAdminRoute(request);
  if (platformErr) return platformErr;

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
