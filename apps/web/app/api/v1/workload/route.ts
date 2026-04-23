/**
 * GET /api/v1/workload?audience=manager|stakeholder|leadership
 * Wave 4 Step 16 — role-based operational inbox (read model).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  buildLeadershipWorkload,
  buildManagerWorkload,
  buildStakeholderWorkload,
} from "@/lib/domain/workload/workload.service";

export const dynamic = "force-dynamic";

const AUDIENCES = new Set(["manager", "stakeholder", "leadership"]);

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

  const url = new URL(request.url);
  const raw = url.searchParams.get("audience") ?? "manager";
  if (!AUDIENCES.has(raw)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const audience = raw as "manager" | "stakeholder" | "leadership";

  const data =
    audience === "manager"
      ? await buildManagerWorkload(supabase, ctx)
      : audience === "stakeholder"
        ? await buildStakeholderWorkload(supabase, ctx)
        : await buildLeadershipWorkload(supabase, ctx);

  return NextResponse.json({ data });
}
