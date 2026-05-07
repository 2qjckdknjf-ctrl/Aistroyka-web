/**
 * GET /api/v1/projects/:id/daily-digest — Phase 7 daily digest (manager vs customer-safe owner).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getProject } from "@/lib/domain/projects/project.service";
import {
  buildManagerProjectDailyDigest,
  buildOwnerProjectDailyDigest,
} from "@/lib/domain/digest/daily-digest.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const url = new URL(request.url);
  const audience = url.searchParams.get("audience") === "owner" ? "owner" : "manager";
  const supabase = await createClientFromRequest(request);

  if (audience === "manager") {
    if (!canManageProjects(ctx)) {
      return NextResponse.json({ error: "Manager access required" }, { status: 403 });
    }
    const { data: project, error } = await getProject(supabase, ctx, projectId);
  if (error) return NextResponse.json({ error }, { status: 403 });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const data = await buildManagerProjectDailyDigest(supabase, ctx, projectId, project.name);
    return NextResponse.json({ data });
  }

  const { data, error } = await buildOwnerProjectDailyDigest(supabase, ctx, projectId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) {
    return NextResponse.json({ error: error || "Not available" }, { status: 400 });
  }
  return NextResponse.json({ data });
}
