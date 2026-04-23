/**
 * GET /api/v1/projects/:id/handover
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getHandoverForManager, getHandoverPublicSummary } from "@/lib/domain/project-handover/project-handover.service";
import { canManageProjectHandover } from "@/lib/domain/project-handover/project-handover.policy";

export const dynamic = "force-dynamic";

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

  if (await canManageProjectHandover(supabase, ctx, projectId)) {
    const { data, error } = await getHandoverForManager(supabase, ctx, projectId);
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 400 });
    return NextResponse.json({ data, audience: "manager" });
  }

  const { data, error } = await getHandoverPublicSummary(supabase, ctx, projectId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 400 });
  return NextResponse.json({ data, audience: "stakeholder" });
}
