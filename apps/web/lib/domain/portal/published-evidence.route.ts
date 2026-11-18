import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { isUuid } from "@/lib/platform/ai/media-path-tenant-guard";
import { listPublishedEvidence, downloadPublishedEvidence, PublishedEvidenceError } from "./published-evidence.service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", "CDN-Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store", "Vary": "Authorization, Cookie", "X-Content-Type-Options": "nosniff" };
export async function publishedEvidenceResponse(request: Request, projectId: string, evidenceId?: string) {
  try {
    if (!isUuid(projectId) || (evidenceId !== undefined && !isUuid(evidenceId))) {
      throw new PublishedEvidenceError(400, "Invalid identifier");
    }
    const ctx = await getTenantContextFromRequest(request);
    requireTenant(ctx);
    const client = await createClientFromRequest(request);
    if (evidenceId) {
      const blob = await downloadPublishedEvidence(client, ctx, projectId, evidenceId);
      return new Response(blob, { headers: { ...PRIVATE_HEADERS, "Content-Type": blob.type, "Content-Disposition": `inline; filename="${evidenceId}"` } });
    }
    const data = await listPublishedEvidence(client, ctx, projectId);
    return NextResponse.json({ data }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    const status = error instanceof PublishedEvidenceError ? error.status
      : error instanceof TenantRequiredError ? 401 : error instanceof TenantForbiddenError ? 403 : 503;
    const message = error instanceof PublishedEvidenceError ? error.message
      : status === 401 ? "Authentication required" : status === 403 ? "Access denied" : "Published evidence temporarily unavailable";
    return NextResponse.json({ error: message }, { status, headers: PRIVATE_HEADERS });
  }
}
