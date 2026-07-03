/**
 * GET /api/v1/admin/billing/provider-status
 * Internal: billing provider diagnostics (Step 15).
 * Admin only. No secrets. Safe for rollout visibility.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { requirePlatformOwnerLegacyAdminRoute } from "@/lib/api/require-platform-admin-legacy-route";
import { getBillingAdapterDiagnostics } from "@/lib/platform/billing-readiness/billing-adapter-registry";
import { getStripePriceMappingDiagnostics } from "@/lib/platform/billing-readiness/stripe-price-mapping";
import { getStripeWebhookIngressConfig } from "@/lib/platform/billing-readiness/billing-provider-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const platformErr = await requirePlatformOwnerLegacyAdminRoute(request);
  if (platformErr) return platformErr;

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

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
