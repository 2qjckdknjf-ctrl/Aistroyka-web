import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { finalizeUploadSession } from "@/lib/domain/upload-session/upload-session.service";
import {
  IDEMPOTENCY_HEADER,
  getCachedResponse,
  storeResponse,
} from "@/lib/platform/idempotency/idempotency.service";
import { checkRequestBodySize } from "@/lib/api/request-limit";

export const dynamic = "force-dynamic";

const ROUTE = "/api/v1/media/upload-sessions/finalize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sizeError = checkRequestBodySize(request);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 413 });
  const { id: sessionId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const supabase = await createClient();
  const idemKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (idemKey && ctx.tenantId && ctx.userId) {
    const cached = await getCachedResponse(supabase, idemKey, ctx.tenantId, ctx.userId, ROUTE);
    if (cached) return NextResponse.json(cached.response, { status: cached.statusCode });
  }
  let body: { object_path?: string; mime_type?: string; size_bytes?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const object_path = typeof body.object_path === "string" ? body.object_path.trim() : "";
  if (!object_path) return NextResponse.json({ error: "object_path required" }, { status: 400 });
  const { ok, error } = await finalizeUploadSession(supabase, ctx, sessionId, {
    object_path,
    mime_type: typeof body.mime_type === "string" ? body.mime_type : undefined,
    size_bytes: typeof body.size_bytes === "number" ? body.size_bytes : undefined,
  });
  if (!ok) return NextResponse.json({ error }, { status: 403 });
  const response = { ok: true };
  if (idemKey && ctx.tenantId && ctx.userId) {
    await storeResponse(supabase, idemKey, ctx.tenantId, ctx.userId, ROUTE, response, 200);
  }
  return NextResponse.json(response);
}
