import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { startDay } from "@/lib/domain/worker-day/worker-day.service";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { WorkerDayStartRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/worker/day/start";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
  let rawBody: unknown;
  try {
    rawBody = await request.json().catch(() => ({}));
  } catch {
    rawBody = {};
  }
  const parsed = WorkerDayStartRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = await createClientFromRequest(request);
  const { data, error } = await startDay(supabase, ctx);
  if (error) return NextResponse.json({ error }, { status: 403 });
  const idemStore = await storeLiteIdempotency(request, ctx, ROUTE_KEY, { data }, 200);
  if (!idemStore.ok) return idemStore.response;
  return NextResponse.json({ data });
}
