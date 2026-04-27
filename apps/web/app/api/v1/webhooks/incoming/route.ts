/**
 * Incoming webhooks — signature verification, payload validation, domain event publish.
 */

import { NextResponse } from "next/server";
import { verifyIncomingWebhook } from "@/lib/webhooks/webhook-verifier";
import { handleIncomingWebhook } from "@/lib/webhooks/webhook-handler";

export const dynamic = "force-dynamic";

/** POST /api/webhooks/incoming — verify, validate, optional replay check, publish domain event. */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const secret = process.env.WEBHOOK_INCOMING_SECRET ?? null;
  const verification = await verifyIncomingWebhook(request, bodyText, {
    secret: secret || undefined,
    signatureHeader: "x-webhook-signature",
  });
  if (!verification.valid) {
    return NextResponse.json(
      { error: "Verification failed", reason: verification.error },
      { status: 401 }
    );
  }
  const payload = verification.payload!;
  const tenantId = (payload.data as { tenantId?: string } | undefined)?.tenantId
    ?? request.headers.get("x-tenant-id")?.trim()
    ?? "";
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenant context (body.data.tenantId or x-tenant-id)" },
      { status: 400 }
    );
  }
  const projectId = (payload.data as { projectId?: string } | undefined)?.projectId ?? null;
  const result = await handleIncomingWebhook(payload, {
    tenantId,
    projectId,
    // Replay: optional; pass isReplay(key) when you have a store
  });
  if (!result.accepted) {
    return NextResponse.json(
      { error: result.error ?? "Not accepted", eventType: result.eventType },
      { status: 409 }
    );
  }
  return NextResponse.json({
    received: true,
    eventType: result.eventType,
    eventId: result.eventId,
  });
}
