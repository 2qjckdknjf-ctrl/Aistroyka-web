/**
 * GET /api/v1/config — flags, limits, serverTime, traceId, clientProfile.
 * Evaluated for current tenant when authenticated; otherwise flags off.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { getConfigPayload } from "@/lib/platform/flags";
import { isAgenticFoundationEnabled } from "@/lib/agentic/feature-flag";
import { AGENTIC_FOUNDATION_FLAG_KEY } from "@/lib/agentic/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  const supabase = await createClientFromRequest(request);
  const payload = await getConfigPayload(supabase, {
    tenantId: ctx.tenantId,
    traceId: ctx.traceId,
    clientProfile: ctx.clientProfile,
  });
  const agenticEnabled = await isAgenticFoundationEnabled(supabase, ctx.tenantId);
  payload.flags = {
    ...payload.flags,
    [AGENTIC_FOUNDATION_FLAG_KEY]: {
      enabled: agenticEnabled,
      variant: payload.flags[AGENTIC_FOUNDATION_FLAG_KEY]?.variant ?? null,
    },
  };
  return NextResponse.json(payload);
}
