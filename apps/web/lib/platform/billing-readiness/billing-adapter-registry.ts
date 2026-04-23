/**
 * Billing provider registry (Step 13, Step 15).
 * Resolves adapter by config. Default = sandbox. Stripe skeleton behind flag.
 */

import type { BillingProviderAdapter } from "./billing-adapter.types";
import type { BillingProviderKind } from "./billing-readiness.types";
import { sandboxBillingAdapter } from "./billing-adapter-sandbox";
import { stripeBillingAdapter } from "./billing-adapter-stripe";
import { getBillingProviderRuntimeConfig } from "./billing-provider-config";

const ADAPTERS: Map<BillingProviderKind, BillingProviderAdapter> = new Map([
  ["sandbox", sandboxBillingAdapter],
  ["manual", sandboxBillingAdapter],
  ["none", sandboxBillingAdapter],
  ["stripe", stripeBillingAdapter],
]);

/**
 * Get adapter by provider kind. Returns sandbox for unknown/unsupported.
 */
export function getBillingAdapter(providerKind: BillingProviderKind): BillingProviderAdapter {
  const adapter = ADAPTERS.get(providerKind);
  return adapter ?? sandboxBillingAdapter;
}

/**
 * Resolve adapter for runtime. Uses config + feature flag.
 * - Flag OFF or config invalid -> sandbox
 * - Flag ON + config valid -> Stripe skeleton
 */
export function getConfiguredBillingAdapter(): BillingProviderAdapter {
  const runtime = getBillingProviderRuntimeConfig();
  if (runtime.providerKind === "stripe") {
    return stripeBillingAdapter;
  }
  return sandboxBillingAdapter;
}

/**
 * Default adapter for checkout-readiness flow.
 * Same as getConfiguredBillingAdapter: sandbox unless Stripe enabled.
 */
export function getDefaultBillingAdapter(): BillingProviderAdapter {
  return getConfiguredBillingAdapter();
}

/**
 * Diagnostics for admin/debug. Safe to expose (no secrets).
 */
export function getBillingAdapterDiagnostics(): {
  activeAdapterKind: BillingProviderKind;
  providerKind: "stripe" | "sandbox";
  flagEnabled: boolean;
  configValid: boolean;
  fallbackReason: string | null;
  liveCheckoutEnabled: boolean;
  checkoutMode: "sandbox" | "provider_stub" | "provider_live";
  webhookIngressEnabled: boolean;
  webhookConfigValid: boolean;
} {
  const runtime = getBillingProviderRuntimeConfig();
  const adapter = getConfiguredBillingAdapter();
  let checkoutMode: "sandbox" | "provider_stub" | "provider_live" = "sandbox";
  if (runtime.providerKind === "stripe") {
    checkoutMode = runtime.liveCheckoutEnabled ? "provider_live" : "provider_stub";
  }
  const webhookIngressEnabled = runtime.webhookIngressEnabled ?? false;
  const webhookConfigValid =
    webhookIngressEnabled && runtime.configValid && runtime.stripeConfig != null;
  return {
    activeAdapterKind: adapter.getProviderKind(),
    providerKind: runtime.providerKind,
    flagEnabled: runtime.flagEnabled,
    configValid: runtime.configValid,
    fallbackReason: runtime.fallbackReason,
    liveCheckoutEnabled: runtime.liveCheckoutEnabled,
    checkoutMode,
    webhookIngressEnabled,
    webhookConfigValid,
  };
}
