/**
 * GET /api/v1/billing/overview
 * Billing readiness overview (Step 12).
 * Returns selected plan, billing status, readiness flags.
 * No real checkout; honest messaging.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkspaceBillingOverview } from "@/lib/platform/billing-readiness/billing-readiness.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  try {
    const overview = await getWorkspaceBillingOverview(admin, ctx.tenantId);
    return NextResponse.json(overview);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load billing overview",
      },
      { status: 500 }
    );
  }
}
