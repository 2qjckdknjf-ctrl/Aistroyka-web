import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { endDay } from "@/lib/domain/worker-day/worker-day.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/day/end";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
  const supabase = await createClient();
  const { data, error } = await endDay(supabase, ctx);
  if (error) return NextResponse.json({ error }, { status: 403 });
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, { data }, 200);
  return NextResponse.json({ data });
}
