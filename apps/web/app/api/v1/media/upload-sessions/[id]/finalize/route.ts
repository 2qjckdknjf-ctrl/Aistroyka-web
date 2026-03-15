import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { finalizeUploadSession } from "@/lib/domain/upload-session/upload-session.service";
import { checkRequestBodySize } from "@/lib/api/request-limit";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";
import { getOrCreateRequestId, logStructured, withRequestIdAndTiming } from "@/lib/observability";
import { FinalizeUploadSessionRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/media/upload-sessions/:id/finalize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const sizeError = checkRequestBodySize(request);
  if (sizeError) return withRequestIdAndTiming(request, NextResponse.json({ error: sizeError }, { status: 413 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
  const { id: sessionId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
    }
    throw e;
  }
  const admin = getAdminClient();
  if (admin) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
      const rl = await checkRateLimit(admin, { tenantId: ctx.tenantId, ip, endpoint: "/api/v1/media/upload-sessions/:id/finalize" });
      if (rl.limited) return withRequestIdAndTiming(request, NextResponse.json({ error: rl.message }, { status: 429 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
    } catch {
      logStructured({ event: "rate_limit_unavailable", endpoint: "/api/v1/media/upload-sessions/:id/finalize", tenant_id: ctx.tenantId, request_id: getOrCreateRequestId(request) });
    }
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return withRequestIdAndTiming(request, guard.response, { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const parsed = FinalizeUploadSessionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.flatten().fieldErrors.object_path?.[0] ?? "object_path required";
    return withRequestIdAndTiming(request, NextResponse.json({ error: msg }, { status: 400 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const supabase = await createClient();
  const { ok, error } = await finalizeUploadSession(supabase, ctx, sessionId, {
    object_path: parsed.data.object_path,
    mime_type: parsed.data.mime_type,
    size_bytes: parsed.data.size_bytes,
  });
  if (!ok) {
    const status =
      error === "media_object_missing" ? 400 : error === "storage_verification_failed" ? 503 : 403;
    return withRequestIdAndTiming(request, NextResponse.json({ error, code: error === "media_object_missing" ? error : undefined }, { status }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const response = { ok: true };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return withRequestIdAndTiming(request, NextResponse.json(response), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
