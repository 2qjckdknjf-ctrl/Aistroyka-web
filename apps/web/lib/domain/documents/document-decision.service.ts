import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import * as repo from "./document.repository";
import type { ProjectDocument, OwnerDecisionAction } from "./document.types";
import { validateDocumentStatusTransition } from "./document.policy";
import { emitAudit } from "@/lib/observability/audit.service";
import { insertDocumentEvent } from "./document-event.repository";
import { notifyProjectManagers } from "@/lib/domain/notifications/manager-notifications.repository";

const ACTION_TO_STATUS: Record<OwnerDecisionAction, "approved" | "rejected" | "changes_requested"> = {
  approve: "approved",
  reject: "rejected",
  request_changes: "changes_requested",
};

/** Owner decision: under_review -> approved | rejected | changes_requested. Requires project read access. */
export async function performOwnerDecision(
  supabase: SupabaseClient,
  ctx: TenantContext,
  documentId: string,
  projectId: string,
  action: OwnerDecisionAction,
  comment?: string | null
): Promise<{ data: ProjectDocument | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  if (!ctx.userId) return { data: null, error: "User required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const existing = await repo.getById(supabase, documentId, ctx.tenantId);
  if (!existing || existing.project_id !== projectId)
    return { data: null, error: "Document not found" };

  if (existing.status !== "under_review")
    return { data: null, error: "Document is not pending decision" };

  const toStatus = ACTION_TO_STATUS[action];
  const v = validateDocumentStatusTransition("under_review", toStatus);
  if (!v.ok) return { data: null, error: v.reason };

  const trimmedComment =
    typeof comment === "string" ? comment.trim().slice(0, 2000) : null;

  const data = await repo.update(supabase, documentId, ctx.tenantId, {
    status: toStatus,
    decision_comment: trimmedComment ?? undefined,
    decided_by: ctx.userId,
  });

  if (!data) return { data: null, error: "Update failed" };

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    trace_id: ctx.traceId ?? null,
    action: "document_review",
    resource_type: "document",
    resource_id: documentId,
    details: {
      from: "under_review",
      to: toStatus,
      action,
      comment: trimmedComment ?? undefined,
      type: existing.type,
      project_id: projectId,
    },
  });

  const eventType =
    toStatus === "approved" ? "approved" : toStatus === "rejected" ? "rejected" : "changes_requested";
  await insertDocumentEvent(supabase, ctx.tenantId, documentId, eventType, ctx.userId, trimmedComment);

  const decisionLabel = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Changes requested";
  await notifyProjectManagers(supabase, ctx.tenantId, projectId, {
    type: "document_owner_decision",
    title: `Document ${decisionLabel.toLowerCase()}`,
    body: existing.title,
    target_type: "document",
    target_id: documentId,
    project_id: projectId,
  });

  return { data, error: "" };
}
