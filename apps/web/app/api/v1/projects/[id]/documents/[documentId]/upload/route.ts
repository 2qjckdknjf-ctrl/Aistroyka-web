/**
 * POST /api/v1/projects/:id/documents/:documentId/upload — upload file for document.
 * Updates document object_path and status to uploaded.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { getById as getDocumentById } from "@/lib/domain/documents/document.repository";
import { updateDocument } from "@/lib/domain/documents/document.service";
import { MEDIA_BUCKET } from "@/lib/api/engine";
import { buildDocumentUploadObjectPath } from "@/lib/domain/documents/document-upload-path";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: projectId, documentId } = await context.params;
  if (!projectId || !documentId)
    return NextResponse.json({ error: "Missing project or document id" }, { status: 400 });

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
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  if (!canManageProjects(ctx) || !ctx.tenantId)
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });

  const supabase = await createClientFromRequest(request);
  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const doc = await getDocumentById(supabase, documentId, ctx.tenantId);
  if (!doc || doc.project_id !== projectId)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.status !== "draft")
    return NextResponse.json({ error: "Document must be in draft to upload" }, { status: 400 });

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: "Request body too large; max 25MB" }, { status: 413 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: "File too large; max 25MB" }, { status: 413 });

  const ext = file.name.split(".").pop() || "bin";
  const objectPath = buildDocumentUploadObjectPath(
    ctx.tenantId,
    projectId,
    ext,
    crypto.randomUUID()
  );

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, file, { upsert: false });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message ?? "Upload failed" }, { status: 500 });

  const updatedResult = await updateDocument(supabase, ctx, documentId, projectId, {
    object_path: objectPath,
    status: "uploaded",
  });

  if (updatedResult.error || !updatedResult.data) {
    await supabase.storage.from(MEDIA_BUCKET).remove([objectPath]);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
  const updated = updatedResult.data;

  const { data: { publicUrl } } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);

  return NextResponse.json({
    data: {
      document: updated,
      object_path: objectPath,
      file_url: publicUrl,
    },
  });
}
