/**
 * Stripe webhook handler. Verify signature when STRIPE_WEBHOOK_SECRET is set.
 * Updates billing_customers and entitlements on subscription events.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeClient } from "./stripe.client";
import { upsertEntitlements } from "./entitlements.service";

/** Stripe statuses that grant paid entitlements / dashboard access. */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? null;
}

export function isWebhookConfigured(): boolean {
  return getStripeClient() !== null && getWebhookSecret() !== null;
}

/** Verify and parse Stripe event. Returns event or null on invalid. */
export function verifyWebhookEvent(payload: string | Buffer, signature: string | null): import("stripe").Stripe.Event | null {
  const stripe = getStripeClient();
  const secret = getWebhookSecret();
  if (!stripe || !secret || !signature) return null;
  try {
    return stripe.webhooks.constructEvent(
      typeof payload === "string" ? payload : (payload as Buffer).toString("utf8"),
      signature,
      secret
    ) as import("stripe").Stripe.Event;
  } catch {
    return null;
  }
}

/** Map Stripe plan/price to tier. */
export function planToTier(planId: string): string {
  const p = planId.toLowerCase();
  if (p.includes("enterprise")) return "ENTERPRISE";
  if (p.includes("pro")) return "PRO";
  return "FREE";
}

/**
 * Entitlement tier for a Stripe subscription status + price.
 * Non-active statuses (canceled, past_due, unpaid, incomplete, …) must not keep paid tiers.
 */
export function entitlementTierForSubscription(status: string, planId: string): string {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) return "FREE";
  return planToTier(planId);
}

type SubscriptionPeriodFields = {
  id: string;
  customer: string;
  status: string;
  items?: { data?: Array<{ price?: { id?: string } }> };
  current_period_start?: number;
  current_period_end?: number;
};

async function syncBillingCustomerAndEntitlements(
  supabase: SupabaseClient,
  tenantId: string,
  subscription: SubscriptionPeriodFields
): Promise<void> {
  const planId = subscription.items?.data?.[0]?.price?.id ?? "";
  const tier = entitlementTierForSubscription(subscription.status, planId);
  await supabase.from("billing_customers").upsert(
    {
      tenant_id: tenantId,
      stripe_subscription_id: subscription.id,
      plan: planId || null,
      status: subscription.status,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    },
    { onConflict: "tenant_id" }
  );
  await upsertEntitlements(supabase, { tenant_id: tenantId, tier });
}

/** Apply subscription created/updated: sync billing_customers and entitlements. */
export async function handleSubscriptionUpdated(
  supabase: SupabaseClient,
  subscription: SubscriptionPeriodFields
): Promise<void> {
  const tenantId = await resolveTenantByStripeCustomer(supabase, subscription.customer as string);
  if (!tenantId) return;
  await syncBillingCustomerAndEntitlements(supabase, tenantId, subscription);
}

/**
 * Apply subscription deleted: mark billing canceled and revoke paid entitlements.
 * Stripe may omit a final `customer.subscription.updated` with status=canceled.
 */
export async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: { id: string; customer: string; items?: { data?: Array<{ price?: { id?: string } }> } }
): Promise<void> {
  const tenantId = await resolveTenantByStripeCustomer(supabase, subscription.customer as string);
  if (!tenantId) return;
  await syncBillingCustomerAndEntitlements(supabase, tenantId, {
    id: subscription.id,
    customer: subscription.customer,
    status: "canceled",
    items: subscription.items,
  });
}

async function resolveTenantByStripeCustomer(supabase: SupabaseClient, stripeCustomerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("billing_customers")
    .select("tenant_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return (data as { tenant_id: string } | null)?.tenant_id ?? null;
}

/** Handle checkout.session.completed: link tenant to Stripe customer. */
export async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: { id: string; customer: string | null; client_reference_id: string | null }
): Promise<void> {
  const tenantId = session.client_reference_id ?? null;
  const customerId = session.customer as string | null;
  if (!tenantId || !customerId) return;
  await supabase.from("billing_customers").upsert(
    {
      tenant_id: tenantId,
      stripe_customer_id: customerId,
    },
    { onConflict: "tenant_id" }
  );
}
