import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectDocument,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./document.types";

const DOCUMENT_SELECT =
  "id, tenant_id, project_id, type, title, description, status, object_path, created_by, report_id, task_id, milestone_id, created_at, updated_at";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select(DOCUMENT_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ProjectDocument[];
}

export async function getById(
  supabase: SupabaseClient,
  documentId: string,
  tenantId: string
): Promise<ProjectDocument | null> {
  const { data, error } = await supabase
    .from("project_documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectDocument;
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  input: CreateDocumentInput
): Promise<ProjectDocument | null> {
  const { data, error } = await supabase
    .from("project_documents")
    .insert({
      tenant_id: tenantId,
      project_id: input.project_id,
      type: input.type,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? "draft",
      object_path: input.object_path ?? null,
      created_by: userId,
      report_id: input.report_id ?? null,
      task_id: input.task_id ?? null,
      milestone_id: input.milestone_id ?? null,
    })
    .select(DOCUMENT_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectDocument;
}

export async function update(
  supabase: SupabaseClient,
  documentId: string,
  tenantId: string,
  input: UpdateDocumentInput
): Promise<ProjectDocument | null> {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined)
    payload.description = input.description?.trim() || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.object_path !== undefined) payload.object_path = input.object_path;
  if (input.report_id !== undefined) payload.report_id = input.report_id;
  if (input.task_id !== undefined) payload.task_id = input.task_id;
  if (input.milestone_id !== undefined) payload.milestone_id = input.milestone_id;

  if (Object.keys(payload).length === 0) {
    return getById(supabase, documentId, tenantId);
  }

  const { data, error } = await supabase
    .from("project_documents")
    .update(payload)
    .eq("id", documentId)
    .eq("tenant_id", tenantId)
    .select(DOCUMENT_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectDocument;
}
