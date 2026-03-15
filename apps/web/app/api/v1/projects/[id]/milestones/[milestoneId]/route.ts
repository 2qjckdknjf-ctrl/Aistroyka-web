import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getMilestoneById, updateMilestone } from "@/lib/domain/milestones/milestone.service";
import type { UpdateMilestoneInput } from "@/lib/domain/milestones/milestone.types";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/milestones/:milestoneId — milestone detail (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { milestoneId } = await context.params;
  if (!milestoneId) return NextResponse.json({ error: "Missing milestone id" }, { status: 400 });

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
  const { data, error } = await getMilestoneById(supabase, ctx, milestoneId);
  if (error) return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/projects/:id/milestones/:milestoneId — update milestone (manager). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { milestoneId } = await context.params;
  if (!milestoneId) return NextResponse.json({ error: "Missing milestone id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input: UpdateMilestoneInput = {};
  if (typeof body.title === "string") input.title = body.title.trim();
  if (body.description !== undefined) input.description = typeof body.description === "string" ? body.description : null;
  if (typeof body.target_date === "string") input.target_date = body.target_date.trim();
  if (typeof body.status === "string" && ["pending", "in_progress", "done", "cancelled"].includes(body.status)) input.status = body.status as UpdateMilestoneInput["status"];
  if (typeof body.sort_order === "number") input.sort_order = body.sort_order;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateMilestone(supabase, ctx, milestoneId, input);
  if (error) return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
