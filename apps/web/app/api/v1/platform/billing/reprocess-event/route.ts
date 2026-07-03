/**
 * POST /api/v1/platform/billing/reprocess-event
 * Internal: reprocess single billing event (Step 19). Platform owner only.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { reprocessBillingEventOps } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "write" });
  if (!auth.ok) return auth.response;

const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  let body: { eventId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = body.eventId?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const result = await reprocessBillingEventOps(admin, eventId);

  return NextResponse.json(result);
}
