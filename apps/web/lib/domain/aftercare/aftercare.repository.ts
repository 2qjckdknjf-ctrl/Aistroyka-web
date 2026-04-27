import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ServiceRequestCoverageType,
  ServiceRequestEventRow,
  ServiceRequestListItem,
  ServiceRequestRow,
  ServiceRequestStatus,
} from "./aftercare.types";

const ROW =
  "id, tenant_id, project_id, title, description, status, coverage_type, assigned_to, due_date, resolution_note, resolved_at, resolved_by, linked_handover_id, linked_defect_id, linked_discussion_id, created_by, created_at, updated_at";

export async function insertServiceRequest(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    title: string;
    description: string | null;
    status: ServiceRequestStatus;
    coverage_type: ServiceRequestCoverageType;
    assigned_to: string | null;
    due_date: string | null;
    linked_handover_id: string | null;
    linked_defect_id: string | null;
    linked_discussion_id: string | null;
    created_by: string;
  }
): Promise<ServiceRequestRow | null> {
  const { data, error } = await supabase
    .from("project_service_requests")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      title: row.title.trim(),
      description: row.description?.trim() || null,
      status: row.status,
      coverage_type: row.coverage_type,
      assigned_to: row.assigned_to,
      due_date: row.due_date,
      linked_handover_id: row.linked_handover_id,
      linked_defect_id: row.linked_defect_id,
      linked_discussion_id: row.linked_discussion_id,
      created_by: row.created_by,
    })
    .select(ROW)
    .single();
  if (error || !data) return null;
  return data as ServiceRequestRow;
}

/** Open aftercare / service requests (not terminal). */
export async function countOpenByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("project_service_requests")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .neq("status", "closed");
  if (error) return 0;
  return count ?? 0;
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<ServiceRequestListItem[]> {
  const limit = Math.min(opts?.limit ?? 100, 150);
  const { data, error } = await supabase
    .from("project_service_requests")
    .select("id, title, status, coverage_type, due_date, updated_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ServiceRequestListItem[];
}

export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<ServiceRequestRow | null> {
  const { data, error } = await supabase
    .from("project_service_requests")
    .select(ROW)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ServiceRequestRow;
}

export async function updateServiceRequest(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: ServiceRequestStatus;
    coverage_type: ServiceRequestCoverageType;
    assigned_to: string | null;
    due_date: string | null;
    resolution_note: string | null;
    resolved_at: string | null;
    resolved_by: string | null;
    linked_handover_id: string | null;
    linked_defect_id: string | null;
    linked_discussion_id: string | null;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("project_service_requests")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  return !error;
}

export async function listEvents(
  supabase: SupabaseClient,
  serviceRequestId: string,
  tenantId: string
): Promise<ServiceRequestEventRow[]> {
  const { data, error } = await supabase
    .from("project_service_request_events")
    .select("id, service_request_id, from_status, to_status, actor_user_id, note, created_at")
    .eq("service_request_id", serviceRequestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ServiceRequestEventRow[];
}

export async function insertEvent(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    service_request_id: string;
    from_status: string | null;
    to_status: string;
    actor_user_id: string;
    note: string | null;
  }
): Promise<boolean> {
  const { error } = await supabase.from("project_service_request_events").insert({
    tenant_id: row.tenant_id,
    project_id: row.project_id,
    service_request_id: row.service_request_id,
    from_status: row.from_status,
    to_status: row.to_status,
    actor_user_id: row.actor_user_id,
    note: row.note?.trim() || null,
  });
  return !error;
}
