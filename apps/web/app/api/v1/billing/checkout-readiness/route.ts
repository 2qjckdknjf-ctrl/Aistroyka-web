/**
 * POST /api/v1/billing/checkout-readiness
 * Create checkout session (readiness only, Step 12).
 * Validates plan and workspace; creates record; returns safe placeholder.
 * No real provider call or redirect.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { createBillingCheckoutSessionService } from "@/lib/platform/billing-readiness/billing-readiness.service";
import { CreateCheckoutSessionRequestSchema } from "@/lib/platform/billing-readiness/billing-readiness.contracts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
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
  const parsed = CreateCheckoutSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await createBillingCheckoutSessionService(admin, {
    workspaceId: ctx.tenantId!,
    request: parsed.data,
    createdByUserId: ctx.userId,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(data);
}
