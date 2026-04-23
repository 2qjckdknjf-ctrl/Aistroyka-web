/**
 * GET /api/v1/portfolio/control
 * Wave 4 Step 15 — multi-project operational portfolio (explainable signals, not BI).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { buildPortfolioControl } from "@/lib/domain/portfolio/portfolio-control.service";

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

  const supabase = await createClientFromRequest(request);
  const data = await buildPortfolioControl(supabase, ctx);

  return NextResponse.json({ data });
}
