/**
 * Billing provider config and feature flag (Step 15, Step 16, Step 17).
 * Stripe skeleton: explicit validation, graceful fallback.
 * Policy: provider OFF or invalid config -> sandbox.
 * Live checkout: separate flag, default OFF.
 * Webhook ingress: separate flag, default OFF.
 */

export interface StripeBillingConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string | null;
}

export interface BillingProviderConfigResult {
  valid: boolean;
  providerKind: "stripe" | "sandbox";
  config: StripeBillingConfig | null;
  reason: string;
}

const FLAG_PROVIDER = "ENABLE_STRIPE_BILLING_PROVIDER";
const FLAG_LIVE_CHECKOUT = "ENABLE_STRIPE_LIVE_CHECKOUT";
const FLAG_WEBHOOK_INGRESS = "ENABLE_STRIPE_WEBHOOK_INGRESS";

function getEnv(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Check if Stripe billing provider feature flag is enabled.
 * Does not validate config.
 */
export function isStripeBillingProviderFlagEnabled(): boolean {
  const v = getEnv(FLAG_PROVIDER);
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

/**
 * Check if live Stripe checkout is enabled.
 * Requires provider flag ON. Default OFF.
 */
export function isStripeLiveCheckoutFlagEnabled(): boolean {
  if (!isStripeBillingProviderFlagEnabled()) return false;
  const v = getEnv(FLAG_LIVE_CHECKOUT);
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

/**
 * Check if Stripe webhook ingress is enabled (Step 17).
 * Requires provider flag ON. Default OFF.
 */
export function isStripeWebhookIngressFlagEnabled(): boolean {
  if (!isStripeBillingProviderFlagEnabled()) return false;
  const v = getEnv(FLAG_WEBHOOK_INGRESS);
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

/**
 * Webhook ingress config validation (Step 17).
 * Returns valid only when provider + webhook flag ON and webhook secret valid.
 */
export function getStripeWebhookIngressConfig(): {
  enabled: boolean;
  webhookSecretValid: boolean;
  reason: string;
} {
  if (!isStripeBillingProviderFlagEnabled()) {
    return { enabled: false, webhookSecretValid: false, reason: "Provider flag not enabled" };
  }
  if (!isStripeWebhookIngressFlagEnabled()) {
    return { enabled: false, webhookSecretValid: false, reason: "Webhook ingress flag not enabled" };
  }
  const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return { enabled: true, webhookSecretValid: false, reason: "STRIPE_WEBHOOK_SECRET missing" };
  }
  if (!webhookSecret.startsWith("whsec_")) {
    return { enabled: true, webhookSecretValid: false, reason: "STRIPE_WEBHOOK_SECRET invalid format" };
  }
  return { enabled: true, webhookSecretValid: true, reason: "Webhook ingress ready" };
}

/**
 * Validate Stripe config. Returns config only when both secret and webhook secret are present and valid.
 */
export function getStripeBillingConfig(): BillingProviderConfigResult {
  const secretKey = getEnv("STRIPE_SECRET_KEY");
  const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
  const publishableKey = getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") || null;

  if (!secretKey) {
    return { valid: false, providerKind: "sandbox", config: null, reason: "STRIPE_SECRET_KEY missing or empty" };
  }
  if (!secretKey.startsWith("sk_")) {
    return { valid: false, providerKind: "sandbox", config: null, reason: "STRIPE_SECRET_KEY invalid format" };
  }
  if (!webhookSecret) {
    return { valid: false, providerKind: "sandbox", config: null, reason: "STRIPE_WEBHOOK_SECRET missing or empty" };
  }
  if (!webhookSecret.startsWith("whsec_")) {
    return { valid: false, providerKind: "sandbox", config: null, reason: "STRIPE_WEBHOOK_SECRET invalid format" };
  }

  return {
    valid: true,
    providerKind: "stripe",
    config: { secretKey, webhookSecret, publishableKey },
    reason: "Stripe config valid",
  };
}

/**
 * Provider is configured and ready for skeleton use.
 * Requires: flag ON + valid config.
 */
export function isStripeBillingConfigured(): boolean {
  if (!isStripeBillingProviderFlagEnabled()) return false;
  const result = getStripeBillingConfig();
  return result.valid;
}

/**
 * Get runtime config for adapter resolution.
 * Returns diagnostics when invalid.
 */
export function getBillingProviderRuntimeConfig(): {
  providerKind: "stripe" | "sandbox";
  stripeConfig: StripeBillingConfig | null;
  flagEnabled: boolean;
  configValid: boolean;
  fallbackReason: string | null;
  liveCheckoutEnabled: boolean;
  webhookIngressEnabled: boolean;
} {
  const flagEnabled = isStripeBillingProviderFlagEnabled();
  const stripeResult = getStripeBillingConfig();
  const liveCheckoutEnabled = isStripeLiveCheckoutFlagEnabled();

  const webhookIngressEnabled = isStripeWebhookIngressFlagEnabled();

  if (!flagEnabled) {
    return {
      providerKind: "sandbox",
      stripeConfig: null,
      flagEnabled: false,
      configValid: stripeResult.valid,
      fallbackReason: "ENABLE_STRIPE_BILLING_PROVIDER not enabled",
      liveCheckoutEnabled: false,
      webhookIngressEnabled: false,
    };
  }
  if (!stripeResult.valid) {
    return {
      providerKind: "sandbox",
      stripeConfig: null,
      flagEnabled: true,
      configValid: false,
      fallbackReason: stripeResult.reason,
      liveCheckoutEnabled: false,
      webhookIngressEnabled: false,
    };
  }

  return {
    providerKind: "stripe",
    stripeConfig: stripeResult.config,
    flagEnabled: true,
    configValid: true,
    fallbackReason: null,
    liveCheckoutEnabled,
    webhookIngressEnabled,
  };
}
