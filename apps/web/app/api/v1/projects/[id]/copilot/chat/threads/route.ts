import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import {
  createCopilotThread,
  listCopilotThreads,
} from "@/lib/copilot/chat-history.service";

export const dynamic = "force-dynamic";

async function resolveProjectRequest(request: Request, projectId: string) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (error) {
    if (error instanceof TenantRequiredError) {
      return {
        errorResponse: NextResponse.json({ error: error.message }, { status: 401 }),
      } as const;
    }
    throw error;
  }

  if (!ctx.tenantId || !ctx.userId) {
    return {
      errorResponse: NextResponse.json({ error: "Authenticated tenant user required" }, { status: 401 }),
    } as const;
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError || !project) {
    return {
      errorResponse: NextResponse.json(
        { error: projectError ?? "Not found" },
        { status: projectError === "Insufficient rights" ? 403 : 404 }
      ),
    } as const;
  }

  return { ctx, supabase, errorResponse: null } as const;
}

/** GET /api/v1/projects/:id/copilot/chat/threads?limit=20 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const resolved = await resolveProjectRequest(request, projectId);
  if (resolved.errorResponse) return resolved.errorResponse;

  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? "20");
  const { data, error } = await listCopilotThreads(
    resolved.supabase,
    resolved.ctx.tenantId!,
    resolved.ctx.userId!,
    projectId,
    rawLimit
  );
  if (error) return NextResponse.json({ error }, { status: 503 });
  return NextResponse.json({ data });
}

/** POST /api/v1/projects/:id/copilot/chat/threads */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const resolved = await resolveProjectRequest(request, projectId);
  if (resolved.errorResponse) return resolved.errorResponse;

  let body: { title?: unknown } = {};
  try {
    body = (await request.json()) as { title?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title : null;

  const { data, error } = await createCopilotThread(
    resolved.supabase,
    resolved.ctx.tenantId!,
    resolved.ctx.userId!,
    projectId,
    title
  );
  if (error || !data) return NextResponse.json({ error: error || "Create failed" }, { status: 503 });
  return NextResponse.json({ data }, { status: 201 });
}
