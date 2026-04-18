import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectDocumentEventType =
  | "created"
  | "file_uploaded"
  | "submitted_for_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "resubmitted"
  | "archived";

export interface ProjectDocumentEventRow {
  id: string;
  tenant_id: string;
  document_id: string;
  event_type: ProjectDocumentEventType;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

export async function insertDocumentEvent(
  supabase: SupabaseClient,
  tenantId: string,
  documentId: string,
  eventType: ProjectDocumentEventType,
  actorUserId: string,
  note?: string | null
): Promise<boolean> {
  const { error } = await supabase.from("project_document_events").insert({
    tenant_id: tenantId,
    document_id: documentId,
    event_type: eventType,
    actor_user_id: actorUserId,
    note: note ?? null,
  });
  return !error;
}

export async function listDocumentEvents(
  supabase: SupabaseClient,
  tenantId: string,
  documentId: string,
  limit: number = 100
): Promise<ProjectDocumentEventRow[]> {
  const { data, error } = await supabase
    .from("project_document_events")
    .select("id, tenant_id, document_id, event_type, actor_user_id, note, created_at")
    .eq("tenant_id", tenantId)
    .eq("document_id", documentId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProjectDocumentEventRow[];
}
