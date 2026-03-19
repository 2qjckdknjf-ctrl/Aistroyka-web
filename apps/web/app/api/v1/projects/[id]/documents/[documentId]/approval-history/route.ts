/**
 * GET /api/v1/projects/:id/documents/:documentId/approval-history
 *
 * Tenant-scoped audit trail for document lifecycle governance events.
 * Reuses `audit_logs` emitted via `emitAudit` in document.service.ts.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import * as docRepo from "@/lib/domain/documents/document.repository";
import { canReadProjects } from "@/lib/tenant/tenant.policy";
import { listAuditLogsForResource } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

const ACTIONS = new Set([
  "document_upload",
  "document_submit_for_review",
  "document_review",
  "document_archive",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: projectId, documentId } = await context.params;
  if (!projectId || !documentId) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  if (!canReadProjects(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const doc = await docRepo.getById(supabase, documentId, ctx.tenantId!);
  if (!doc || doc.project_id !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await listAuditLogsForResource(
    supabase,
    ctx.tenantId!,
    "document",
    documentId,
    50
  );

  const events = rows
    .filter((r) => ACTIONS.has(r.action))
    .map((r) => ({
      action: r.action,
      user_id: r.user_id,
      created_at: r.created_at,
      details: r.details ?? {},
    }));

  return NextResponse.json({ data: { project_id: projectId, document_id: documentId, events } });
}

