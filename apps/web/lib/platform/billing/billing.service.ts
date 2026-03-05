import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeClient } from "./stripe.client";
import type { BillingCustomerRow } from "./billing.types";

/** Get billing customer by tenant. */
export async function getBillingCustomer(
  supabase: SupabaseClient,
  tenantId: string
): Promise<BillingCustomerRow | null> {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as BillingCustomerRow;
}

/** Create Stripe checkout session (subscription). Returns url or error. Requires Stripe configured. */
export async function createCheckoutSession(
  supabase: SupabaseClient,
  options: { tenantId: string; successUrl: string; cancelUrl: string; priceId?: string; customerEmail?: string }
): Promise<{ url?: string; error: string }> {
  const stripe = getStripeClient();
  if (!stripe) return { error: "Billing not configured" };
  const priceId = options.priceId ?? process.env.STRIPE_PRICE_ID?.trim();
  if (!priceId) return { error: "STRIPE_PRICE_ID not set" };
  const existing = await getBillingCustomer(supabase, options.tenantId);
  const sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: options.tenantId,
  };
  if (existing?.stripe_customer_id) {
    sessionParams.customer = existing.stripe_customer_id;
  } else if (options.customerEmail) {
    sessionParams.customer_email = options.customerEmail;
  }
  const session = await stripe.checkout.sessions.create(sessionParams);
  const url = session.url ?? undefined;
  return { url, error: url ? "" : "No checkout URL" };
}

/** Create Stripe billing portal session. Returns url or error. */
export async function createPortalSession(
  supabase: SupabaseClient,
  options: { tenantId: string; returnUrl: string }
): Promise<{ url?: string; error: string }> {
  const stripe = getStripeClient();
  if (!stripe) return { error: "Billing not configured" };
  const existing = await getBillingCustomer(supabase, options.tenantId);
  if (!existing?.stripe_customer_id) return { error: "No billing customer" };
  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripe_customer_id,
    return_url: options.returnUrl,
  });
  return { url: session.url ?? undefined, error: session.url ? "" : "No portal URL" };
}
