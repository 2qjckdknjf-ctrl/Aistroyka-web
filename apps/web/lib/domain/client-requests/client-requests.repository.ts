import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectClientRequestRow,
  ProjectClientRequestEventRow,
  ClientRequestKind,
  ClientRequestActionMode,
  ClientRequestStatus,
  ClientRequestEventType,
  ClientRequestDecisionType,
  ClientRequestPriority,
} from "./client-requests.types";

const ROW_SELECT =
  "id, tenant_id, project_id, kind, action_mode, status, title, instructions, choice_options, linked_entity_type, linked_entity_id, decision_type, priority, assigned_to, due_at, decided_at, decision_note, customer_visible_amount, customer_visible_currency, requested_by, requested_at, responded_at, responded_by, response_value, response_note, cancelled_at, cancelled_by, completed_at, completed_by, created_at, updated_at";

export async function insertRequest(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    kind: ClientRequestKind;
    action_mode: ClientRequestActionMode;
    title: string;
    instructions: string | null;
    choice_options: unknown;
    linked_entity_type: "document" | "milestone" | null;
    linked_entity_id: string | null;
    decision_type: ClientRequestDecisionType | null;
    priority: ClientRequestPriority;
    assigned_to: string | null;
    due_at: string | null;
    customer_visible_amount: number | null;
    customer_visible_currency: string | null;
    requested_by: string;
  }
): Promise<ProjectClientRequestRow | null> {
  const { data, error } = await supabase
    .from("project_client_requests")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      kind: row.kind,
      action_mode: row.action_mode,
      status: "open",
      title: row.title.trim(),
      instructions: row.instructions?.trim() || null,
      choice_options: row.choice_options ?? null,
      linked_entity_type: row.linked_entity_type,
      linked_entity_id: row.linked_entity_id,
      decision_type: row.decision_type,
      priority: row.priority,
      assigned_to: row.assigned_to,
      due_at: row.due_at,
      customer_visible_amount: row.customer_visible_amount,
      customer_visible_currency: row.customer_visible_currency?.trim() || null,
      requested_by: row.requested_by,
    })
    .select(ROW_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectClientRequestRow;
}

export async function getById(
  supabase: SupabaseClient,
  requestId: string,
  tenantId: string
): Promise<ProjectClientRequestRow | null> {
  const { data, error } = await supabase
    .from("project_client_requests")
    .select(ROW_SELECT)
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectClientRequestRow;
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { status?: ClientRequestStatus | "all" }
): Promise<ProjectClientRequestRow[]> {
  let q = supabase
    .from("project_client_requests")
    .select(ROW_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("requested_at", { ascending: false });
  if (opts?.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as ProjectClientRequestRow[];
}

export async function updateRequest(
  supabase: SupabaseClient,
  requestId: string,
  tenantId: string,
  patch: Partial<{
    status: ClientRequestStatus;
    responded_at: string | null;
    responded_by: string | null;
    response_value: string | null;
    response_note: string | null;
    completed_at: string | null;
    completed_by: string | null;
    cancelled_at: string | null;
    cancelled_by: string | null;
  }>
): Promise<ProjectClientRequestRow | null> {
  const { data, error } = await supabase
    .from("project_client_requests")
    .update(patch)
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .select(ROW_SELECT)
    .single();
  if (error || !data) return null;
  return data as ProjectClientRequestRow;
}

export async function insertEvent(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    request_id: string;
    actor_user_id: string | null;
    event_type: ClientRequestEventType;
    payload?: Record<string, unknown> | null;
  }
): Promise<ProjectClientRequestEventRow | null> {
  const { data, error } = await supabase
    .from("project_client_request_events")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      request_id: row.request_id,
      actor_user_id: row.actor_user_id,
      event_type: row.event_type,
      payload: row.payload ?? null,
    })
    .select("id, tenant_id, project_id, request_id, actor_user_id, event_type, payload, created_at")
    .single();
  if (error || !data) return null;
  return data as ProjectClientRequestEventRow;
}

export async function listEventsByRequest(
  supabase: SupabaseClient,
  requestId: string,
  tenantId: string
): Promise<ProjectClientRequestEventRow[]> {
  const { data, error } = await supabase
    .from("project_client_request_events")
    .select("id, tenant_id, project_id, request_id, actor_user_id, event_type, payload, created_at")
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ProjectClientRequestEventRow[];
}

/** All events for a project (newest first). Used by stakeholder activity timeline (Wave 4 Step 9). */
export async function listEventsForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<ProjectClientRequestEventRow[]> {
  const limit = Math.min(opts?.limit ?? 250, 500);
  const { data, error } = await supabase
    .from("project_client_request_events")
    .select("id, tenant_id, project_id, request_id, actor_user_id, event_type, payload, created_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProjectClientRequestEventRow[];
}
