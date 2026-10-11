import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { isUuid } from "@/lib/platform/ai/media-path-tenant-guard";
import { listReportPublication, setReportPublication, ReportPublicationError } from "@/lib/domain/visual-evidence/report-publication.service";
import { emitAudit } from "@/lib/observability/audit.service";
import { boundedProductWrite } from "@/lib/growth/product-events";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Authorization, Cookie" };

async function respond(request: Request, id: string, mutate: boolean) {
  try {
    if (!isUuid(id)) throw new ReportPublicationError(400, "Invalid report identifier");
    const ctx = await getTenantContextFromRequest(request); requireTenant(ctx);
    const client = await createClientFromRequest(request);
    if (!mutate) return NextResponse.json({ data: await listReportPublication(client, ctx, id) }, { headers });
    let body;
    try { body = await request.json(); } catch { throw new ReportPublicationError(400, "Invalid JSON"); }
    if (!body || !isUuid(body.attachment_id) || typeof body.visible !== "boolean"
        || !(body.expected_version === null || (typeof body.expected_version === "string" && body.expected_version.length <= 64 && Number.isFinite(Date.parse(body.expected_version)))))
      throw new ReportPublicationError(400, "Attachment, visibility and expected version required");
    const data = await setReportPublication(client, ctx, id,
      { attachmentId: body.attachment_id, visible: body.visible, expectedVersion: body.expected_version });
    await boundedProductWrite(() => emitAudit(client, { tenant_id: ctx.tenantId, user_id: ctx.userId,
      trace_id: ctx.traceId ?? null, action: "report_photo_publication", resource_type: "report", resource_id: id,
      details: { attachment_id: body.attachment_id, evidence_id: data.evidence_id, visible: body.visible } }));
    return NextResponse.json({ data }, { headers });
  } catch (error) {
    const status = error instanceof ReportPublicationError ? error.status : error instanceof TenantRequiredError ? 401 : error instanceof TenantForbiddenError ? 403 : 503;
    return NextResponse.json({ error: error instanceof ReportPublicationError ? error.message : "Report publication unavailable" }, { status, headers });
  }
}
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return respond(request, (await context.params).id, false); }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { return respond(request, (await context.params).id, true); }
