import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { emitAudit } from "@/lib/observability/audit.service";
import * as repo from "./document.repository";
import type {
  ProjectDocument,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./document.types";
import { validateDocumentStatusTransition } from "./document.policy";

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
  return data ? { data, error: "" } : { data: null, error: "Create failed" };
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

  const data = await repo.update(supabase, documentId, ctx.tenantId, input);
  if (!data) return { data: null, error: "Update failed" };

  // Audit only status transitions (governance events).
  if (statusFrom !== statusTo) {
    let action: string | null = null;
    if (statusFrom === "draft" && statusTo === "uploaded") action = "document_upload";
    else if (statusFrom === "uploaded" && statusTo === "under_review")
      action = "document_submit_for_review";
    else if (statusFrom === "under_review" && (statusTo === "approved" || statusTo === "rejected"))
      action = "document_review";
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
    }
  }

  return { data, error: "" };
}
