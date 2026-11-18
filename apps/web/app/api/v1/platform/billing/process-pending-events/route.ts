/**
 * POST /api/v1/platform/billing/process-pending-events
 * Internal: reprocess pending billing events (Step 14).
 * Platform owner only. No public billing endpoint.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { processPendingBillingEvents } from "@/lib/platform/billing-readiness/billing-event-processor.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

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
