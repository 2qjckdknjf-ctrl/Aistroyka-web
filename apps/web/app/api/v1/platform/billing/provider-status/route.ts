/**
 * GET /api/v1/platform/billing/provider-status
 * Internal: billing provider diagnostics (Step 15).
 * Platform owner only. No secrets. Safe for rollout visibility.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getBillingAdapterDiagnostics } from "@/lib/platform/billing-readiness/billing-adapter-registry";
import { getStripePriceMappingDiagnostics } from "@/lib/platform/billing-readiness/stripe-price-mapping";
import { getStripeWebhookIngressConfig } from "@/lib/platform/billing-readiness/billing-provider-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

const diag = getBillingAdapterDiagnostics();
  const priceMapping = getStripePriceMappingDiagnostics();
  const priceMappingValid = Object.values(priceMapping).some((v) => v !== null);
  const webhookIngressConfig = getStripeWebhookIngressConfig();

  return NextResponse.json({
    activeAdapterKind: diag.activeAdapterKind,
    providerKind: diag.providerKind,
    providerEnabled: diag.flagEnabled && diag.configValid,
    configValid: diag.configValid,
    flagEnabled: diag.flagEnabled,
    liveCheckoutEnabled: diag.liveCheckoutEnabled,
    checkoutMode: diag.checkoutMode,
    webhookIngressEnabled: diag.webhookIngressEnabled,
    webhookConfigValid: diag.webhookConfigValid,
    webhookIngressReady: webhookIngressConfig.enabled && webhookIngressConfig.webhookSecretValid,
    priceMappingValid,
    fallbackReason: diag.fallbackReason,
    sandboxFallbackActive: diag.activeAdapterKind === "sandbox" || diag.activeAdapterKind === "manual",
  });
}
