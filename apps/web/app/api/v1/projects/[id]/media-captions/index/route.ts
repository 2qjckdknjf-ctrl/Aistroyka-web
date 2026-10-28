/**
 * POST /api/v1/projects/:id/media-captions/index
 * AIS-MEM-016: index transcript/caption segments for lexical search.
 * Contractor-internal owner/admin only. Never portal.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { replaceMediaCaptionSegments } from "@/lib/domain/media-captions/media-caption-index.service";
import { emitAudit } from "@/lib/observability/audit.service";
import type { TranscriptionSegment } from "@/lib/platform/ai/openai-transcription";

export const dynamic = "force-dynamic";

export async function POST(
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
      return NextResponse.json(
        { error: e.message },
        { status: e.message.includes("membership") ? 403 : 401 }
      );
    }
    throw e;
  }
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mediaId = typeof body.media_id === "string" ? body.media_id : String(body.mediaId ?? "");
  const fullText =
    typeof body.text === "string" ? body.text : typeof body.full_text === "string" ? body.full_text : null;
  const language =
    typeof body.language === "string" ? body.language : null;
  const rawSegments = Array.isArray(body.segments) ? body.segments : [];
  const segments: TranscriptionSegment[] = [];
  for (const item of rawSegments) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text : "";
    if (!text.trim()) continue;
    const start =
      typeof record.start_seconds === "number"
        ? record.start_seconds
        : typeof record.startSeconds === "number"
          ? record.startSeconds
          : null;
    const end =
      typeof record.end_seconds === "number"
        ? record.end_seconds
        : typeof record.endSeconds === "number"
          ? record.endSeconds
          : null;
    segments.push({ startSeconds: start, endSeconds: end, text });
  }

  const supabase = await createClientFromRequest(request);
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: ctx.tenantId!,
  });
  if (membership.error) {
    return NextResponse.json({ error: membership.error.message }, { status: 500 });
  }
  if (membership.data !== true) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const project = await getProjectRow(supabase, projectId, ctx.tenantId!);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await replaceMediaCaptionSegments(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    mediaId,
    actorUserId: ctx.userId!,
    language,
    segments,
    fullText,
  });
  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT" ? 400 : result.code === "MEDIA_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "media_caption_segments_indexed",
    resource_type: "media",
    resource_id: mediaId,
    details: { project_id: projectId, inserted: result.inserted, source: "manager" },
  });

  return NextResponse.json({ data: { inserted: result.inserted } }, { status: 201 });
}
