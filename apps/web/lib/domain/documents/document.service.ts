import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { emitAudit } from "@/lib/observability/audit.service";
import { notifyProjectOwners } from "@/lib/domain/notifications/manager-notifications.repository";
import * as repo from "./document.repository";
import type {
  ProjectDocument,
  ProjectDocumentStatus,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./document.types";
import { validateDocumentStatusTransition } from "./document.policy";
import { insertDocumentEvent, type ProjectDocumentEventType } from "./document-event.repository";

export async function listDocuments(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectDocument[]; error: string }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: [], error: "Project not found" };

  const data = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data, error: "" };
}

export async function getDocumentById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  documentId: string,
  projectId: string
): Promise<{ data: ProjectDocument | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const doc = await repo.getById(supabase, documentId, ctx.tenantId);
  if (!doc || doc.project_id !== projectId)
    return { data: null, error: "Document not found" };

  return { data: doc, error: "" };
}

export async function createDocument(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateDocumentInput
): Promise<{ data: ProjectDocument | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  if (!ctx.userId) return { data: null, error: "User required" };

  const project = await getProjectById(supabase, input.project_id, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const trimmed = input.title?.trim();
  if (!trimmed) return { data: null, error: "title required" };

  const validTypes = ["document", "act", "contract"] as const;
  if (!validTypes.includes(input.type))
    return { data: null, error: "Invalid type" };

  // Governance semantics: new documents start in draft.
  // File upload and review transitions are controlled by dedicated routes/UI.
  if (input.status && input.status !== "draft") {
    return { data: null, error: "status must be draft on create" };
  }

  const data = await repo.create(supabase, ctx.tenantId, ctx.userId, {
    ...input,
    title: trimmed,
  });
  if (!data) return { data: null, error: "Create failed" };
  await insertDocumentEvent(supabase, ctx.tenantId, data.id, "created", ctx.userId, null);
  return { data, error: "" };
}

export async function updateDocument(
  supabase: SupabaseClient,
  ctx: TenantContext,
  documentId: string,
  projectId: string,
  input: UpdateDocumentInput
): Promise<{ data: ProjectDocument | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const existing = await repo.getById(supabase, documentId, ctx.tenantId);
  if (!existing || existing.project_id !== projectId)
    return { data: null, error: "Document not found" };

  const statusFrom = existing.status;
  const statusTo = input.status !== undefined ? input.status : existing.status;

  // If updating object_path, status must be 'uploaded' (i.e. an upload transition).
  if (input.object_path !== undefined) {
    if (input.status !== "uploaded") {
      return { data: null, error: "invalid_object_path_update" };
    }
  }

  if (input.status !== undefined && input.status !== existing.status) {
    const v = validateDocumentStatusTransition(statusFrom, input.status);
    if (!v.ok) return { data: null, error: v.reason };
  }

  const reviewOutcomes: ProjectDocumentStatus[] = [
    "approved",
    "rejected",
    "changes_requested",
  ];
  const isManagerReviewTransition =
    statusFrom === "under_review" &&
    input.status !== undefined &&
    input.status !== existing.status &&
    reviewOutcomes.includes(input.status);

  const inputForRepo: UpdateDocumentInput =
    isManagerReviewTransition && input.decided_by === undefined && ctx.userId
      ? { ...input, decided_by: ctx.userId }
      : input;

  const data = await repo.update(supabase, documentId, ctx.tenantId, inputForRepo);
  if (!data) return { data: null, error: "Update failed" };

  // Audit only status transitions (governance events).
  if (statusFrom !== statusTo) {
    let action: string | null = null;
    if (statusFrom === "draft" && statusTo === "uploaded") action = "document_upload";
    else if (statusFrom === "uploaded" && statusTo === "under_review")
      action = "document_submit_for_review";
    else if (statusFrom === "under_review" && (statusTo === "approved" || statusTo === "rejected" || statusTo === "changes_requested"))
      action = "document_review";
    else if (statusFrom === "changes_requested" && (statusTo === "uploaded" || statusTo === "under_review"))
      action = "document_resubmit";
    else if (statusTo === "archived") action = "document_archive";

    if (action) {
      await emitAudit(supabase, {
        tenant_id: ctx.tenantId!,
        user_id: ctx.userId,
        trace_id: ctx.traceId ?? null,
        action,
        resource_type: "document",
        resource_id: documentId,
        details: { from: statusFrom, to: statusTo, type: existing.type, project_id: projectId },
      });
      const eventType = mapAuditActionToDocumentEvent(action, statusTo);
      if (eventType && ctx.userId) {
        const note =
          action === "document_review"
            ? (input.decision_comment ?? inputForRepo.decision_comment ?? null)
            : null;
        await insertDocumentEvent(supabase, ctx.tenantId!, documentId, eventType, ctx.userId, note);
      }
      if (action === "document_submit_for_review") {
        await notifyProjectOwners(supabase, ctx.tenantId!, projectId, {
          type: "document_under_review",
          title: "Document submitted for review",
          body: existing.title,
          target_type: "document",
          target_id: documentId,
          project_id: projectId,
        });
      } else if (action === "document_resubmit") {
        await notifyProjectOwners(supabase, ctx.tenantId!, projectId, {
          type: "document_resubmitted",
          title: "Document resubmitted for review",
          body: existing.title,
          target_type: "document",
          target_id: documentId,
          project_id: projectId,
        });
      }
    }
  }

  return { data, error: "" };
}

function mapAuditActionToDocumentEvent(
  action: string,
  statusTo: ProjectDocumentStatus
): ProjectDocumentEventType | null {
  switch (action) {
    case "document_upload":
      return "file_uploaded";
    case "document_submit_for_review":
      return "submitted_for_review";
    case "document_review":
      if (statusTo === "approved") return "approved";
      if (statusTo === "rejected") return "rejected";
      if (statusTo === "changes_requested") return "changes_requested";
      return null;
    case "document_resubmit":
      return "resubmitted";
    case "document_archive":
      return "archived";
    default:
      return null;
  }
}
