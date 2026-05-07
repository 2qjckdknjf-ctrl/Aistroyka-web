import type { SupabaseClient } from "@supabase/supabase-js";
import type { DefectEventRow, DefectListItem, DefectRow, DefectSeverity, DefectStatus } from "./defects.types";

const ROW =
  "id, tenant_id, project_id, title, description, status, is_blocking, assigned_to, due_date, resolution_note, resolved_at, resolved_by, linked_milestone_id, linked_document_id, linked_discussion_id, linked_request_id, severity, photo_before_report_media_id, photo_after_report_media_id, created_by, created_at, updated_at";

export async function insertDefect(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: DefectStatus;
    is_blocking: boolean;
    assigned_to: string | null;
    due_date: string | null;
    linked_milestone_id: string | null;
    linked_document_id: string | null;
    linked_discussion_id: string | null;
    linked_request_id: string | null;
    created_by: string;
  }
): Promise<DefectRow | null> {
  const { data, error } = await supabase
    .from("project_defects")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      title: row.title.trim(),
      description: row.description?.trim() || null,
      status: row.status,
      is_blocking: row.is_blocking,
      assigned_to: row.assigned_to,
      due_date: row.due_date,
      linked_milestone_id: row.linked_milestone_id,
      linked_document_id: row.linked_document_id,
      linked_discussion_id: row.linked_discussion_id,
      linked_request_id: row.linked_request_id,
      created_by: row.created_by,
    })
    .select(ROW)
    .single();
  if (error || !data) return null;
  return data as DefectRow;
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<DefectListItem[]> {
  const limit = Math.min(opts?.limit ?? 100, 150);
  const { data, error } = await supabase
    .from("project_defects")
    .select("id, title, status, is_blocking, due_date, updated_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as DefectListItem[];
}

export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<DefectRow | null> {
  const { data, error } = await supabase
    .from("project_defects")
    .select(ROW)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as DefectRow;
}

export async function updateDefect(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: DefectStatus;
    is_blocking: boolean;
    assigned_to: string | null;
    due_date: string | null;
    resolution_note: string | null;
    resolved_at: string | null;
    resolved_by: string | null;
    linked_milestone_id: string | null;
    linked_document_id: string | null;
    linked_discussion_id: string | null;
    linked_request_id: string | null;
    severity: DefectSeverity | null;
    photo_before_report_media_id: string | null;
    photo_after_report_media_id: string | null;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("project_defects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  return !error;
}

export async function countBlockingOpen(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("project_defects")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .eq("is_blocking", true)
    .in("status", ["open", "in_progress", "ready_for_verification"]);
  if (error) return 0;
  return count ?? 0;
}

export async function listEvents(
  supabase: SupabaseClient,
  defectId: string,
  tenantId: string
): Promise<DefectEventRow[]> {
  const { data, error } = await supabase
    .from("project_defect_events")
    .select("id, defect_id, from_status, to_status, actor_user_id, note, created_at")
    .eq("defect_id", defectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as DefectEventRow[];
}

export async function insertEvent(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    defect_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
  }
): Promise<boolean> {
  const { error } = await supabase.from("project_defect_events").insert({
    tenant_id: row.tenant_id,
    project_id: row.project_id,
    defect_id: row.defect_id,
    from_status: row.from_status,
    to_status: row.to_status,
    actor_user_id: row.actor_user_id,
    note: row.note?.trim() || null,
  });
  return !error;
}

export async function listForTimeline(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<Array<{ id: string; title: string; status: string; is_blocking: boolean; created_at: string; resolved_at: string | null }>> {
  const limit = Math.min(opts?.limit ?? 40, 80);
  const { data, error } = await supabase
    .from("project_defects")
    .select("id, title, status, is_blocking, created_at, resolved_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    is_blocking: boolean;
    created_at: string;
    resolved_at: string | null;
  }>;
}
