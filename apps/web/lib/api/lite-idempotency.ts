/**
 * Idempotency enforcement for lite client (ios_lite, android_lite) write requests.
 * Lite writes must send x-idempotency-key; duplicate keys return cached response.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";
import type { TenantContextOrAbsent } from "@/lib/tenant/tenant.types";

const LITE_CLIENTS = ["ios_lite", "android_lite"] as const;

function isLiteClient(header: string | null | undefined): boolean {
  const v = header?.toLowerCase().trim();
  return v === "ios_lite" || v === "android_lite";
}

export const IDEMPOTENCY_KEY_REQUIRED_CODE = "idempotency_key_required";

/**
 * If request is from a lite client, require x-idempotency-key and optionally return cached response.
 * Returns { ok: true } to proceed, or { ok: false, response } to return immediately.
 */
export async function requireLiteIdempotency(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const client = request.headers.get("x-client")?.toLowerCase().trim();
  if (!isLiteClient(client)) return { ok: true };

  const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!key) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "x-idempotency-key is required for lite clients", code: IDEMPOTENCY_KEY_REQUIRED_CODE },
        { status: 400 }
      ),
    };
  }

  if (!ctx.tenantId || !ctx.userId) {
    return { ok: true };
  }

  const admin = getAdminClient();
  if (!admin) return { ok: true };

  const cached = await getCachedResponse(admin, key, ctx.tenantId, ctx.userId, routeKey);
  if (cached) {
    return {
      ok: false,
      response: NextResponse.json(cached.response, { status: cached.statusCode }),
    };
  }

  return { ok: true };
}

/**
 * Store response for lite client idempotency. Call after successful handler execution.
 */
export async function storeLiteIdempotency(
  request: Request,
  ctx: TenantContextOrAbsent,
  routeKey: string,
  responseBody: unknown,
  statusCode: number
): Promise<void> {
  const client = request.headers.get("x-client")?.toLowerCase().trim();
  if (!isLiteClient(client)) return;
  const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!key || !ctx.tenantId || !ctx.userId) return;

  const admin = getAdminClient();
  if (!admin) return;

  await storeResponse(admin, key, ctx.tenantId, ctx.userId, routeKey, responseBody, statusCode);
}
