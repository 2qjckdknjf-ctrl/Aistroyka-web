import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createUploadSession } from "@/lib/domain/upload-session/upload-session.service";
import { listForManager } from "@/lib/domain/upload-session/upload-session.repository";
import { checkRequestBodySize } from "@/lib/api/request-limit";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/media/upload-sessions";
const PURPOSES = ["report_before", "report_after", "project_media"] as const;

/** GET /api/v1/media/upload-sessions — list sessions (tenant-scoped). Query: limit, offset, status, stuck=1 (created/uploaded older than threshold), stuck_hours (optional, default 4). */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const status = url.searchParams.get("status") ?? undefined;
  const stuck = url.searchParams.get("stuck") === "1" || url.searchParams.get("stuck") === "true";
  const stuckHoursParam = url.searchParams.get("stuck_hours");
  const stuckHours = stuckHoursParam ? Math.max(1, Math.min(168, parseInt(stuckHoursParam, 10) || 4)) : undefined;
  const userId = url.searchParams.get("user_id") ?? url.searchParams.get("worker_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const supabase = await createClient();
  const { rows, total } = await listForManager(supabase, ctx.tenantId!, { limit, offset, status, stuck, stuckHours, userId, from, to });
  return NextResponse.json({ data: rows, total });
}

export async function POST(request: Request) {
  const sizeError = checkRequestBodySize(request);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 413 });
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
  let body: { purpose?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    /* empty ok */
  }
  const purpose = typeof body.purpose === "string" && PURPOSES.includes(body.purpose as typeof PURPOSES[number])
    ? (body.purpose as typeof PURPOSES[number])
    : "project_media";
  const supabase = await createClient();
  const { data, error } = await createUploadSession(supabase, ctx, purpose);
  if (error) return NextResponse.json({ error }, { status: 403 });
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, { data }, 200);
  return NextResponse.json({ data });
}
