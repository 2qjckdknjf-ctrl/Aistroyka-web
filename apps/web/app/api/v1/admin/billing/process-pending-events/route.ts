/**
 * POST /api/v1/admin/billing/process-pending-events
 * Internal: reprocess pending billing events (Step 14).
 * Admin only. No public billing endpoint.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { getAdminClient } from "@/lib/supabase/admin";
import { processPendingBillingEvents } from "@/lib/platform/billing-readiness/billing-event-processor.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);

  const results = await processPendingBillingEvents(admin, limit);
  const processed = results.filter((r) => r.status === "processed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const noop = results.filter((r) => r.status === "noop").length;

  return NextResponse.json({
    ok: true,
    total: results.length,
    processed,
    failed,
    skipped,
    noop,
    results: results.map((r) => ({ eventId: r.eventId, status: r.status, idempotentHit: r.idempotentHit })),
  });
}
