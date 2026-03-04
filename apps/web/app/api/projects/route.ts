import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { isTenantContextPresent } from "@/lib/tenant/tenant.types";
import { listProjects, createProject } from "@/lib/domain/projects/project.service";

/** GET /api/projects — list projects for current user (tenant). Uses domain project.service. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  if (!isTenantContextPresent(ctx)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data, error } = await listProjects(supabase, ctx);
  if (error) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data });
}

/** POST /api/projects — create project. Uses domain project.service. */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ success: false, error: e.message }, { status: 401 });
    }
    throw e;
  }
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const result = await createProject(supabase, ctx, name);
  if ("error" in result) {
    const status = result.error.includes("Insufficient") ? 403 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true, data: { id: result.id } });
}
