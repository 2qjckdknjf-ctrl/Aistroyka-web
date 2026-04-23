import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectHandoverEventRow, ProjectHandoverRow, ProjectHandoverStatus } from "./project-handover.types";

const SELECT =
  "id, tenant_id, project_id, status, handover_notes, handed_over_at, handed_over_by, completed_at, completed_by, created_at, updated_at";

export async function getByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectHandoverRow | null> {
  const { data, error } = await supabase
    .from("project_handover")
    .select(SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectHandoverRow;
}

export async function insertHandover(
  supabase: SupabaseClient,
  row: { tenant_id: string; project_id: string }
): Promise<ProjectHandoverRow | null> {
  const { data, error } = await supabase
    .from("project_handover")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      status: "in_progress",
    })
    .select(SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectHandoverRow;
}

export async function updateHandover(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    status: ProjectHandoverStatus;
    handover_notes: string | null;
    handed_over_at: string | null;
    handed_over_by: string | null;
    completed_at: string | null;
    completed_by: string | null;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("project_handover")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  return !error;
}

export async function listEvents(
  supabase: SupabaseClient,
  handoverId: string,
  tenantId: string
): Promise<ProjectHandoverEventRow[]> {
  const { data, error } = await supabase
    .from("project_handover_events")
    .select("id, handover_id, from_status, to_status, actor_user_id, note, created_at")
    .eq("handover_id", handoverId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ProjectHandoverEventRow[];
}

export async function insertEvent(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    handover_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
  }
): Promise<ProjectHandoverEventRow | null> {
  const { data, error } = await supabase
    .from("project_handover_events")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      handover_id: row.handover_id,
      from_status: row.from_status,
      to_status: row.to_status,
      actor_user_id: row.actor_user_id,
      note: row.note?.trim() || null,
    })
    .select("id, handover_id, from_status, to_status, actor_user_id, note, created_at")
    .single();
  if (error || !data) return null;
  return data as ProjectHandoverEventRow;
}

/** Timeline: recent status transitions. */
export async function listRecentEventsForTimeline(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<Array<{ to_status: string; created_at: string; note: string | null }>> {
  const limit = Math.min(opts?.limit ?? 20, 40);
  const { data, error } = await supabase
    .from("project_handover_events")
    .select("to_status, created_at, note")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Array<{ to_status: string; created_at: string; note: string | null }>;
}
