/**
 * GET /api/v1/portal/projects/:id — full stakeholder-safe project view (same contract as client-view).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getPortalProjectView } from "@/lib/domain/portal/portal.service";

export const dynamic = "force-dynamic";

function mapErrorToStatus(error: string): number {
  if (error === "Insufficient rights") return 403;
  if (error === "Project not found") return 404;
  if (error === "Client portal is not enabled") return 404;
  return 400;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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
  const { data, error } = await getPortalProjectView(supabase, ctx, projectId);
  if (!data) return NextResponse.json({ error: error || "Not available" }, { status: mapErrorToStatus(error) });
  return NextResponse.json({ data });
}
