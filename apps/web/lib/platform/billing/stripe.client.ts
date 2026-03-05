/**
 * Stripe client. When STRIPE_SECRET_KEY is not set, all functions return null / no-op.
 * Use getStripeClient() to check availability.
 */

const getSecretKey = (): string | null => {
  if (typeof process === "undefined" || !process.env) return null;
  const k = process.env.STRIPE_SECRET_KEY?.trim();
  return k && k.startsWith("sk_") ? k : null;
};

let stripeInstance: import("stripe").Stripe | null = null;

export function getStripeClient(): import("stripe").Stripe | null {
  if (stripeInstance !== null) return stripeInstance;
  const key = getSecretKey();
  if (!key) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe");
    stripeInstance = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
    return stripeInstance;
  } catch {
    return null;
  }
}

export function isStripeConfigured(): boolean {
  return getStripeClient() !== null;
}
