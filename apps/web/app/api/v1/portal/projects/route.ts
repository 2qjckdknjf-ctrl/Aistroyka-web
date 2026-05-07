/**
 * GET /api/v1/portal/projects — customer portal project list (portal enabled; stakeholder or project owner).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { listPortalProjects } from "@/lib/domain/portal/portal.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listPortalProjects(supabase, ctx);
  if (error === "Tenant required") return NextResponse.json({ error }, { status: 401 });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}
