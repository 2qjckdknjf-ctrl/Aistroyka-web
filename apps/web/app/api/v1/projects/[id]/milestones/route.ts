import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listMilestones, createMilestone } from "@/lib/domain/milestones/milestone.service";
import type { CreateMilestoneInput, MilestoneStatus } from "@/lib/domain/milestones/milestone.types";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/milestones — list project milestones (tenant-scoped). */
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
  const { data, error } = await listMilestones(supabase, ctx, projectId);
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** POST /api/v1/projects/:id/milestones — create milestone (manager). Body: title, target_date, description?, status?, sort_order? */
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
  const target_date = typeof body.target_date === "string" ? body.target_date.trim() : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!target_date) return NextResponse.json({ error: "target_date required" }, { status: 400 });

  const validStatuses: MilestoneStatus[] = ["pending", "in_progress", "done", "cancelled"];
  const status = typeof body.status === "string" && validStatuses.includes(body.status as MilestoneStatus) ? (body.status as MilestoneStatus) : undefined;

  const input: CreateMilestoneInput = {
    project_id: projectId,
    title,
    target_date,
    description: typeof body.description === "string" ? body.description : undefined,
    status,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined,
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createMilestone(supabase, ctx, input);
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
