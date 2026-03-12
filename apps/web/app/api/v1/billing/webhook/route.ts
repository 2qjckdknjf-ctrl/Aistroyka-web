/**
 * POST /api/v1/billing/webhook — Stripe webhook (signature verified; server-only).
 * No auth; verified by Stripe-Signature.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookEvent, handleSubscriptionUpdated, handleCheckoutCompleted, isWebhookConfigured } from "@/lib/platform/billing/webhooks.handler";
import { BILLING_503_BODY } from "@/lib/platform/billing/billing-responses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = getAdminClient();
  if (!admin || !isWebhookConfigured()) {
    return NextResponse.json(BILLING_503_BODY, { status: 503 });
  }
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  const event = verifyWebhookEvent(raw, sig);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const { data: existing } = await (admin as any).from("processed_stripe_events").select("event_id").eq("event_id", event.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true });
  }
  const { error: insertErr } = await (admin as any).from("processed_stripe_events").insert({ event_id: event.id });
  if (insertErr) {
    const conflict = insertErr.code === "23505";
    if (conflict) return NextResponse.json({ received: true });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { id: string; customer: string | null; client_reference_id: string | null };
      await handleCheckoutCompleted(admin, session);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const sub = event.data.object as {
        id: string;
        customer: string;
        status: string;
        items?: { data?: Array<{ price?: { id?: string } }> };
        current_period_start?: number;
        current_period_end?: number;
      };
      await handleSubscriptionUpdated(admin, sub);
    }
  } catch {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
