/**
 * POST /api/v1/tenant/active — set or clear the HttpOnly active-tenant cookie.
 *
 * Body: { "tenantId": "<uuid>" } to select, or { "tenantId": null } to clear.
 * Auth required (session cookie via createClient). Membership/ownership validated
 * server-side (never trusts client role).
 *
 * CSRF: browser cookie-auth mutations require positive same-origin proof
 * (matching Origin, or Sec-Fetch-Site: same-origin). Missing both fails closed.
 * This endpoint is intentionally browser-cookie only — API/mobile clients should
 * send `x-tenant-id` per request instead of mutating this cookie. No Bearer
 * cookie-write path (avoids confusing non-browser auth with HttpOnly Set-Cookie).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  ACTIVE_TENANT_COOKIE,
  activeTenantCookieClearOptions,
  activeTenantCookieSetOptions,
  assertSameOriginMutation,
  isTenantIdFormat,
  userCanAccessTenant,
} from "@/lib/tenant/active-tenant";

const BodySchema = z.object({
  tenantId: z.union([z.string(), z.null()]),
});

export async function POST(request: Request) {
  const originGate = assertSameOriginMutation(request);
  if (!originGate.ok) {
    return NextResponse.json({ error: originGate.error }, { status: originGate.status });
  }

  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const raw = parsed.data.tenantId;
  if (raw === null) {
    const res = NextResponse.json({ ok: true, tenantId: null, cleared: true });
    res.cookies.set(ACTIVE_TENANT_COOKIE, "", activeTenantCookieClearOptions());
    return res;
  }

  const tenantId = raw.trim();
  if (!isTenantIdFormat(tenantId)) {
    return NextResponse.json({ error: "Invalid tenant id.", code: "INVALID_TENANT_ID" }, { status: 400 });
  }

  const access = await userCanAccessTenant(supabase, user.id, tenantId);
  if (!access.ok) {
    return NextResponse.json(
      { error: "Active tenant lookup failed.", code: "ACTIVE_TENANT_QUERY_ERROR" },
      { status: 503 }
    );
  }
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Tenant not authorized.", code: "ACTIVE_TENANT_UNAUTHORIZED" },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true, tenantId, cleared: false });
  res.cookies.set(ACTIVE_TENANT_COOKIE, tenantId, activeTenantCookieSetOptions());
  return res;
}

/** DELETE clears the active-tenant cookie (same CSRF/auth rules as POST clear). */
export async function DELETE(request: Request) {
  const originGate = assertSameOriginMutation(request);
  if (!originGate.ok) {
    return NextResponse.json({ error: originGate.error }, { status: originGate.status });
  }

  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, tenantId: null, cleared: true });
  res.cookies.set(ACTIVE_TENANT_COOKIE, "", activeTenantCookieClearOptions());
  return res;
}
