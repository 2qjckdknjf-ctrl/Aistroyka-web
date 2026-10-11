import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects } from "@/lib/tenant/tenant.policy";
import { isUuid, inspectMediaPathScope } from "@/lib/platform/ai/media-path-tenant-guard";
import { MEDIA_BUCKET } from "@/lib/platform/ai/media-bucket.constants";
import { downloadPrivateOriginal } from "@/lib/platform/media/private-original-download";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "CDN-Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" };
class DownloadError extends Error { constructor(public status: number) { super("Document unavailable"); } }
type Source = { id: string; tenant_id: string; project_id: string; object_path: string | null; updated_at: string };
async function scopedDocument(client: SupabaseClient, ctx: TenantContext, documentId: string, projectId: string): Promise<Source> {
  if (ctx.role === "stakeholder" || ctx.clientProfile === "ios_customer" || !canReadProjects(ctx)) throw new DownloadError(403);
  const project = await client.from("projects").select("id").eq("id", projectId).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (project.error) throw new DownloadError(503);
  if (!project.data) throw new DownloadError(404);
  const doc = await client.from("project_documents").select("id,tenant_id,project_id,object_path,updated_at").eq("id", documentId).eq("tenant_id", ctx.tenantId).eq("project_id", projectId).maybeSingle();
  if (doc.error) throw new DownloadError(503);
  if (!doc.data || doc.data.tenant_id !== ctx.tenantId || doc.data.project_id !== projectId) throw new DownloadError(404);
  return doc.data;
}
export async function GET(request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { id: projectId, documentId } = await context.params;
    if (!isUuid(projectId) || !isUuid(documentId)) throw new DownloadError(400);
    const ctx = await getTenantContextFromRequest(request); requireTenant(ctx);
    const client = await createClientFromRequest(request);
    const doc = await scopedDocument(client, ctx, documentId, projectId);
    if (!doc.object_path) throw new DownloadError(404);
    const path = inspectMediaPathScope(doc.object_path!, ctx.tenantId!);
    if (path.kind === "denied" || (path.kind === "project_prefix_candidate" && path.projectIdCandidate !== projectId)
      || (path.kind === "tenant_prefixed" && !path.bucketRelativePath.startsWith(`${ctx.tenantId}/${projectId}/documents/`))) throw new DownloadError(404);
    const { data: blob, error } = await downloadPrivateOriginal(client, path.bucketRelativePath, 25 * 1024 * 1024);
    if (error || !blob) throw new DownloadError(error?.status ?? 503);
    // Re-resolve current membership/account and document binding after I/O.
    const currentCtx = await getTenantContextFromRequest(request); requireTenant(currentCtx);
    if (currentCtx.tenantId !== ctx.tenantId || currentCtx.userId !== ctx.userId) throw new DownloadError(403);
    const current = await scopedDocument(client, currentCtx, documentId, projectId);
    if (current.object_path !== doc.object_path || current.updated_at !== doc.updated_at) throw new DownloadError(404);
    // Current Storage SELECT policy checks active account/current internal role.
    // The one-second token remains server-side; only the buffered original is returned.
    const currentAccess = await client.storage.from(MEDIA_BUCKET).createSignedUrl(path.bucketRelativePath, 1);
    if (currentAccess.error || !currentAccess.data) throw new DownloadError(503);
    if (blob.size > 25 * 1024 * 1024) throw new DownloadError(413);
    const extension = /\.([a-z0-9]{1,12})$/i.exec(path.bucketRelativePath)?.[1]?.toLowerCase();
    const filename = extension ? `${documentId}.${extension}` : documentId;
    return new Response(blob, { headers: { ...headers, "Content-Type": blob.type || "application/octet-stream", "Content-Disposition": `${["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(blob.type) ? "inline" : "attachment"}; filename="${filename}"` } });
  } catch (error) {
    const status = error instanceof DownloadError ? error.status : error instanceof TenantRequiredError ? 401 : error instanceof TenantForbiddenError ? 403 : 503;
    return Response.json({ error: "Document unavailable" }, { status, headers });
  }
}
