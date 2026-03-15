/**
 * GET /api/v1/projects/:id/costs/:costItemId — cost item detail.
 * PATCH /api/v1/projects/:id/costs/:costItemId — update cost item (manager).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  getCostItemById,
  updateCostItem,
} from "@/lib/domain/costs/cost.service";
import type { ProjectCostItemStatus } from "@/lib/domain/costs/cost.types";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/costs/:costItemId */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; costItemId: string }> }
) {
  const { id: projectId, costItemId } = await context.params;
  if (!projectId || !costItemId)
    return NextResponse.json({ error: "Missing project or cost item id" }, { status: 400 });

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
  const { data, error } = await getCostItemById(supabase, ctx, costItemId, projectId);
  if (error && error !== "Cost item not found" && error !== "Project not found")
    return NextResponse.json({ error }, { status: 403 });
  if (error === "Cost item not found" || error === "Project not found")
    return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/projects/:id/costs/:costItemId — update cost item. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; costItemId: string }> }
) {
  const { id: projectId, costItemId } = await context.params;
  if (!projectId || !costItemId)
    return NextResponse.json({ error: "Missing project or cost item id" }, { status: 400 });

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

  const validStatuses: ProjectCostItemStatus[] = [
    "planned",
    "committed",
    "incurred",
    "approved",
    "archived",
  ];
  const status =
    typeof body.status === "string" && validStatuses.includes(body.status as ProjectCostItemStatus)
      ? (body.status as ProjectCostItemStatus)
      : undefined;

  const planned_amount =
    typeof body.planned_amount === "number"
      ? body.planned_amount
      : typeof body.planned_amount === "string"
        ? parseFloat(body.planned_amount)
        : undefined;
  const actual_amount =
    typeof body.actual_amount === "number"
      ? body.actual_amount
      : typeof body.actual_amount === "string"
        ? parseFloat(body.actual_amount)
        : undefined;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateCostItem(supabase, ctx, costItemId, projectId, {
    category: typeof body.category === "string" ? body.category : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    planned_amount,
    actual_amount,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    status,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    milestone_id: typeof body.milestone_id === "string" ? body.milestone_id : undefined,
  });

  if (error && error !== "Cost item not found" && error !== "Project not found")
    return NextResponse.json({ error }, { status: 403 });
  if (error === "Cost item not found" || error === "Project not found")
    return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ data });
}
