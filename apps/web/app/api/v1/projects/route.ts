/**
 * GET/POST /api/v1/projects — canonical project list/create.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { isTenantContextPresent } from "@/lib/tenant/tenant.types";
import { listProjects, createProject } from "@/lib/domain/projects/project.service";
import { CreateProjectRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects — list projects (tenant-scoped). */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  if (!isTenantContextPresent(ctx)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listProjects(supabase, ctx);
  if (error) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data });
}

/** POST /api/v1/projects — create project. */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ success: false, error: e.message }, { status: 401 });
    }
    throw e;
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }
  const parsed = CreateProjectRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().formErrors[0] ??
      parsed.error.flatten().fieldErrors.name?.[0] ??
      "name required (1-200 chars)";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
  const supabase = await createClientFromRequest(request);
  const result = await createProject(supabase, ctx, parsed.data.name);
  if ("error" in result) {
    const status = result.error.includes("Insufficient") ? 403 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }
  return NextResponse.json({ success: true, data: { id: result.id } });
}
