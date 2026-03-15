/**
 * GET /api/v1/projects/:id/costs — list cost items + budget summary.
 * POST /api/v1/projects/:id/costs — create cost item (manager).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  listCostItems,
  getBudgetSummary,
  createCostItem,
} from "@/lib/domain/costs/cost.service";
import type { ProjectCostItemStatus } from "@/lib/domain/costs/cost.types";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/costs — list cost items and budget summary. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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
  const [itemsResult, summaryResult] = await Promise.all([
    listCostItems(supabase, ctx, projectId),
    getBudgetSummary(supabase, ctx, projectId),
  ]);

  if (itemsResult.error && itemsResult.error !== "Project not found")
    return NextResponse.json({ error: itemsResult.error }, { status: 403 });
  if (itemsResult.error === "Project not found")
    return NextResponse.json({ error: itemsResult.error }, { status: 404 });

  return NextResponse.json({
    data: {
      items: itemsResult.data,
      summary: summaryResult.data ?? {
        project_id: projectId,
        tenant_id: ctx.tenantId!,
        planned_total: 0,
        actual_total: 0,
        currency: "RUB",
        over_budget: false,
        item_count: 0,
      },
    },
  });
}

/** POST /api/v1/projects/:id/costs — create cost item. Body: category, title, planned_amount, actual_amount?, currency?, status?, notes?, milestone_id? */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const planned_amount = typeof body.planned_amount === "number"
    ? body.planned_amount
    : typeof body.planned_amount === "string"
      ? parseFloat(body.planned_amount)
      : NaN;
  if (isNaN(planned_amount) || planned_amount < 0)
    return NextResponse.json({ error: "planned_amount required and must be >= 0" }, { status: 400 });

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

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createCostItem(supabase, ctx, {
    project_id: projectId,
    category: typeof body.category === "string" ? body.category : "other",
    title,
    planned_amount,
    actual_amount:
      typeof body.actual_amount === "number"
        ? body.actual_amount
        : typeof body.actual_amount === "string"
          ? parseFloat(body.actual_amount)
          : undefined,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    status,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    milestone_id: typeof body.milestone_id === "string" ? body.milestone_id : undefined,
  });

  if (error && error !== "Project not found")
    return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
