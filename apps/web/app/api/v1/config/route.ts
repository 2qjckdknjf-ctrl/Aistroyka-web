/**
 * GET /api/v1/config — flags, limits, serverTime, traceId, clientProfile.
 * Evaluated for current tenant when authenticated; otherwise flags off.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { getConfigPayload } from "@/lib/platform/flags";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  const supabase = await createClient();
  const payload = await getConfigPayload(supabase, {
    tenantId: ctx.tenantId,
    traceId: ctx.traceId,
    clientProfile: ctx.clientProfile,
  });
  return NextResponse.json(payload);
}
