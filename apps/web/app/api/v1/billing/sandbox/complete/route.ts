/**
 * POST /api/v1/billing/sandbox/complete
 * Internal sandbox: simulate checkout completion (Step 13).
 * Admin/owner only. No real payment.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize, LitePathForbiddenError } from "@/lib/tenant";
import { completeSandboxCheckout } from "@/lib/platform/billing-readiness/billing-sandbox.service";
import { getBillingCheckoutSession } from "@/lib/platform/billing-readiness/billing-readiness.repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "billing:admin")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await getBillingCheckoutSession(admin, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.workspaceId !== ctx.tenantId) {
    return NextResponse.json({ error: "Session not for this workspace" }, { status: 403 });
  }

  const { success, error } = await completeSandboxCheckout(admin, sessionId);
  if (!success) {
    return NextResponse.json({ error: error ?? "Failed to complete" }, { status: 400 });
  }
  return NextResponse.json({ success: true, sessionId });
}
