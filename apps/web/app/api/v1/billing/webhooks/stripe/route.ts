/**
 * POST /api/v1/billing/webhooks/stripe (Step 17).
 * Real provider webhook ingress behind controlled flags.
 * No auth; verified by Stripe-Signature.
 * Raw body required for signature verification.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { ingestStripeWebhook } from "@/lib/platform/billing-readiness/stripe-webhook-ingress.service";
import { getStripeWebhookIngressConfig } from "@/lib/platform/billing-readiness/billing-provider-config";

export const dynamic = "force-dynamic";

const DISABLED_BODY = { error: "webhook_disabled", code: "stripe_webhook_ingress_off" } as const;
const INVALID_SIG_BODY = { error: "invalid_signature" } as const;
const CONFIG_INVALID_BODY = { error: "config_invalid", code: "webhook_secret_missing_or_invalid" } as const;

export async function POST(request: Request) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "service_unavailable", code: "admin_client_unavailable" }, { status: 503 });
  }

  const config = getStripeWebhookIngressConfig();
  if (!config.enabled) {
    return NextResponse.json(DISABLED_BODY, { status: 503 });
  }
  if (!config.webhookSecretValid) {
    return NextResponse.json(CONFIG_INVALID_BODY, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  const result = await ingestStripeWebhook(admin, rawBody, signature);

  switch (result.status) {
    case "rejected":
      if (result.reason === "Invalid signature") {
        return NextResponse.json(INVALID_SIG_BODY, { status: 400 });
      }
      return NextResponse.json({ error: result.reason }, { status: 400 });
    case "duplicate":
      return NextResponse.json({ received: true }, { status: 200 });
    case "skipped":
      return NextResponse.json({ received: true, skipped: result.reason }, { status: 200 });
    case "processed":
      return NextResponse.json({ received: true, eventId: result.eventId }, { status: 200 });
    case "failed":
      // 500 so Stripe retries; ingress re-applies failed/pending rows on retry.
      return NextResponse.json({ error: result.reason, eventId: result.eventId }, { status: 500 });
    default: {
      const _: never = result;
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }
}
