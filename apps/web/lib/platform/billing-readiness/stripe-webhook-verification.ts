/**
 * Stripe webhook signature verification boundary (Step 17).
 * Isolated from processor. Uses raw body + webhook secret.
 */

import Stripe from "stripe";
import { getStripeWebhookIngressConfig, getBillingProviderRuntimeConfig } from "./billing-provider-config";

/**
 * Verify Stripe webhook signature and parse event.
 * Returns event or null on invalid/missing signature.
 * Requires webhook ingress enabled + valid config (secret key + webhook secret).
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signature: string | null
): Stripe.Event | null {
  const config = getStripeWebhookIngressConfig();
  if (!config.enabled || !config.webhookSecretValid) return null;
  if (!signature) return null;

  const runtime = getBillingProviderRuntimeConfig();
  if (runtime.providerKind !== "stripe" || !runtime.stripeConfig) return null;

  try {
    const stripe = new Stripe(runtime.stripeConfig.secretKey, { apiVersion: "2023-10-16" });
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      runtime.stripeConfig.webhookSecret
    ) as Stripe.Event;
  } catch {
    return null;
  }
}

/**
 * Check if webhook ingress is enabled and config valid.
 */
export function isStripeWebhookIngressReady(): boolean {
  const config = getStripeWebhookIngressConfig();
  return config.enabled && config.webhookSecretValid;
}
