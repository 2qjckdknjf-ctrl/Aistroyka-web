import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getProjectWithAccess } from "@/lib/domain/projects/project-access";
import { listByProject } from "@/lib/domain/media/media.repository";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { resolveAIMediaImage } from "@/lib/platform/ai/resolve-ai-media-image";
import type { Media } from "@/lib/domain/media/media.types";

export const dynamic = "force-dynamic";

const WORKER_MEDIA_CANDIDATE_LIMIT = 12;

function isWorkerSitePhoto(media: Media): boolean {
  const type = media.type?.trim().toLowerCase() ?? "";
  return (
    type === "photo" ||
    type === "image" ||
    type === "before" ||
    type === "after" ||
    type === "issue_evidence" ||
    type.endsWith("_photo") ||
    type.includes("image")
  );
}

/** GET /api/v1/projects/:id/media — list recent project media (photos). Tenant-scoped, read-only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const liteWorker = isLiteWorkerClient(ctx);

  if (liteWorker) {
    // Field clients must have an active project_members row. Return 404 to avoid project enumeration.
    const { project, error } = await getProjectWithAccess(supabase, ctx, projectId);
    if (error || !project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const { data: project, error: projectError } = await getProjectForInternalWorkspace(
      supabase,
      ctx,
      projectId
    );
    if (projectError || !project) {
      const status = projectError === "Insufficient rights" ? 403 : 404;
      return NextResponse.json({ error: projectError ?? "Not found" }, { status });
    }
  }

  const url = new URL(request.url);
  const requestedLimit = Math.min(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 50);

  if (!liteWorker) {
    const data = await listByProject(supabase, projectId, ctx.tenantId!, { limit: requestedLimit });
    return NextResponse.json({ data });
  }

  // The Worker surface only needs one project image. Never expose the manager media catalog or raw file_url.
  const candidates = await listByProject(supabase, projectId, ctx.tenantId!, {
    limit: WORKER_MEDIA_CANDIDATE_LIMIT,
  });
  const photo = candidates.find(isWorkerSitePhoto);
  if (!photo) return NextResponse.json({ data: [] });

  const signed = await resolveAIMediaImage(supabase, {
    tenantId: ctx.tenantId!,
    mediaId: photo.id,
    projectIdClaim: projectId,
  });
  if (!signed.ok) return NextResponse.json({ data: [] });

  return NextResponse.json({
    data: [{ ...photo, file_url: signed.imageUrl }],
  });
}
