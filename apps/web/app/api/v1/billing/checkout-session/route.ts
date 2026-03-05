/**
 * POST /api/v1/billing/checkout-session — create Stripe checkout session (billing_admin).
 * Body: { success_url, cancel_url, price_id?, customer_email? }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { createCheckoutSession } from "@/lib/platform/billing";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
  const body = await request.json().catch(() => ({}));
  const successUrl = typeof body.success_url === "string" ? body.success_url.trim() : "";
  const cancelUrl = typeof body.cancel_url === "string" ? body.cancel_url.trim() : "";
  if (!successUrl || !cancelUrl) {
    return NextResponse.json({ error: "success_url and cancel_url required" }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const result = await createCheckoutSession(admin, {
    tenantId: ctx.tenantId,
    successUrl,
    cancelUrl,
    priceId: typeof body.price_id === "string" ? body.price_id : undefined,
    customerEmail: typeof body.customer_email === "string" ? body.customer_email : undefined,
  });
  if (result.error && !result.url) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await emitAudit(admin, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    action: "checkout_session_create",
    resource_type: "billing",
    resource_id: "",
    details: { has_url: !!result.url },
  });
  return NextResponse.json({ url: result.url });
}
