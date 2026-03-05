/**
 * GET /api/v1/billing/portal — Stripe customer portal URL (billing_admin).
 * Query: return_url (required).
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { createPortalSession, isStripeConfigured } from "@/lib/platform/billing";
import { BILLING_503_BODY } from "@/lib/platform/billing/billing-responses";

export const dynamic = "force-dynamic";

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
  if (!authorize(ctx, "billing:admin")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get("return_url")?.trim() ?? "";
  if (!returnUrl) return NextResponse.json({ error: "return_url required" }, { status: 400 });
  const admin = getAdminClient();
  if (!admin || !isStripeConfigured()) {
    return NextResponse.json(BILLING_503_BODY, { status: 503 });
  }
  const result = await createPortalSession(admin, { tenantId: ctx.tenantId, returnUrl });
  if (result.error && !result.url) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ url: result.url });
}
