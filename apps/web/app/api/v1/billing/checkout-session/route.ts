/**
 * POST /api/v1/billing/checkout-session — create Stripe checkout session (billing_admin).
 * Body: { success_url, cancel_url, price_id?, customer_email? }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { createCheckoutSession, isStripeConfigured } from "@/lib/platform/billing";
import { BILLING_503_BODY } from "@/lib/platform/billing/billing-responses";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

const PLAN_PRICE_ENV_KEYS = {
  starter: "STRIPE_PRICE_STARTER",
  business: "STRIPE_PRICE_BUSINESS",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
} as const;

type CheckoutPlanKey = keyof typeof PLAN_PRICE_ENV_KEYS;

function resolvePriceIdFromRequestBody(body: Record<string, unknown>): string | undefined {
  if (typeof body.price_id === "string" && body.price_id.trim().length > 0) {
    return body.price_id.trim();
  }

  if (typeof body.plan_key !== "string") return undefined;
  const planKey = body.plan_key.trim().toLowerCase() as CheckoutPlanKey;
  const envKey = PLAN_PRICE_ENV_KEYS[planKey];
  if (!envKey) return undefined;
  const envValue = process.env[envKey];
  return typeof envValue === "string" && envValue.trim().length > 0 ? envValue.trim() : undefined;
}

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
  const priceId = resolvePriceIdFromRequestBody(body as Record<string, unknown>);
  const admin = getAdminClient();
  if (!admin || !isStripeConfigured()) {
    return NextResponse.json(BILLING_503_BODY, { status: 503 });
  }
  const result = await createCheckoutSession(admin, {
    tenantId: ctx.tenantId,
    successUrl,
    cancelUrl,
    priceId,
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
