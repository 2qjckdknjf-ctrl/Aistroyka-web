import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import {
  archiveCopilotThread,
  getCopilotThread,
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

/** GET /api/v1/projects/:id/copilot/chat/threads/:threadId?messages_limit=50 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id: projectId, threadId } = await context.params;
  if (!projectId || !threadId) {
    return NextResponse.json({ error: "Missing project or thread id" }, { status: 400 });
  }

  const resolved = await resolveProjectRequest(request, projectId);
  if (resolved.errorResponse) return resolved.errorResponse;

  const rawLimit = Number(new URL(request.url).searchParams.get("messages_limit") ?? "50");
  const { data, error } = await getCopilotThread(
    resolved.supabase,
    resolved.ctx.tenantId!,
    resolved.ctx.userId!,
    projectId,
    threadId,
    rawLimit
  );
  if (!data && error === "Not found") return NextResponse.json({ error }, { status: 404 });
  if (error || !data) return NextResponse.json({ error: error || "Load failed" }, { status: 503 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/projects/:id/copilot/chat/threads/:threadId — archive, never delete. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id: projectId, threadId } = await context.params;
  if (!projectId || !threadId) {
    return NextResponse.json({ error: "Missing project or thread id" }, { status: 400 });
  }

  const resolved = await resolveProjectRequest(request, projectId);
  if (resolved.errorResponse) return resolved.errorResponse;

  let body: { status?: unknown } = {};
  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.status !== "archived") {
    return NextResponse.json({ error: "Only status=archived is allowed" }, { status: 400 });
  }

  const { ok, error } = await archiveCopilotThread(
    resolved.supabase,
    resolved.ctx.tenantId!,
    resolved.ctx.userId!,
    projectId,
    threadId
  );
  if (!ok && error === "Not found") return NextResponse.json({ error }, { status: 404 });
  if (!ok) return NextResponse.json({ error: error || "Archive failed" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
