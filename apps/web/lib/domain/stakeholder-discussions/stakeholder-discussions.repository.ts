import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StakeholderDiscussionDetail,
  StakeholderDiscussionDetailManager,
  StakeholderDiscussionEntryRow,
  StakeholderDiscussionKind,
  StakeholderDiscussionLinkedType,
  StakeholderDiscussionListItem,
  StakeholderDiscussionRow,
  StakeholderDiscussionStatus,
  StakeholderDiscussionEntryKind,
} from "./stakeholder-discussions.types";

const DISC_SELECT =
  "id, tenant_id, project_id, kind, status, title, context, linked_entity_type, linked_entity_id, created_by, resolved_at, resolution_summary, resolved_by, created_at, updated_at";

export async function insertDiscussion(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    kind: StakeholderDiscussionKind;
    status: StakeholderDiscussionStatus;
    title: string;
    context: string | null;
    linked_entity_type: StakeholderDiscussionLinkedType | null;
    linked_entity_id: string | null;
    created_by: string;
  }
): Promise<StakeholderDiscussionRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholder_discussions")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      kind: row.kind,
      status: row.status,
      title: row.title.trim(),
      context: row.context?.trim() || null,
      linked_entity_type: row.linked_entity_type,
      linked_entity_id: row.linked_entity_id,
      created_by: row.created_by,
    })
    .select(DISC_SELECT)
    .single();
  if (error || !data) return null;
  return data as StakeholderDiscussionRow;
}

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<StakeholderDiscussionListItem[]> {
  const limit = Math.min(opts?.limit ?? 50, 100);
  const { data, error } = await supabase
    .from("project_stakeholder_discussions")
    .select(
      "id, kind, status, title, context, linked_entity_type, linked_entity_id, created_at, updated_at"
    )
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as StakeholderDiscussionListItem[];
}

export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<StakeholderDiscussionRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholder_discussions")
    .select(DISC_SELECT)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StakeholderDiscussionRow;
}

export async function listEntries(
  supabase: SupabaseClient,
  discussionId: string,
  tenantId: string
): Promise<StakeholderDiscussionEntryRow[]> {
  const { data, error } = await supabase
    .from("project_stakeholder_discussion_entries")
    .select("id, tenant_id, project_id, discussion_id, author_user_id, entry_kind, body, payload, created_at")
    .eq("discussion_id", discussionId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as StakeholderDiscussionEntryRow[];
}

export async function insertEntry(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    discussion_id: string;
    author_user_id: string;
    entry_kind: StakeholderDiscussionEntryKind;
    body: string;
    payload?: Record<string, unknown>;
  }
): Promise<StakeholderDiscussionEntryRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholder_discussion_entries")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      discussion_id: row.discussion_id,
      author_user_id: row.author_user_id,
      entry_kind: row.entry_kind,
      body: row.body.trim(),
      payload: row.payload ?? {},
    })
    .select("id, tenant_id, project_id, discussion_id, author_user_id, entry_kind, body, payload, created_at")
    .single();
  if (error || !data) return null;
  return data as StakeholderDiscussionEntryRow;
}

export async function updateDiscussion(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    status: StakeholderDiscussionStatus;
    resolution_summary: string | null;
    resolved_at: string | null;
    resolved_by: string | null;
    updated_at: string;
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("project_stakeholder_discussions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  return !error;
}

/** Portal participants cannot UPDATE discussions via RLS; use SECURITY DEFINER RPC (migration 20260401150000). */
export async function updateDiscussionStatusAsPortal(
  supabase: SupabaseClient,
  discussionId: string,
  tenantId: string,
  nextStatus: StakeholderDiscussionStatus
): Promise<boolean> {
  const { data, error } = await supabase.rpc("stakeholder_discussion_portal_set_status", {
    p_discussion_id: discussionId,
    p_tenant_id: tenantId,
    p_next_status: nextStatus,
  });
  if (error) return false;
  return data === true;
}

/** For activity timeline (Wave 4 Step 10 integration). */
export async function listForTimeline(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  opts?: { limit?: number }
): Promise<Array<{ id: string; title: string; created_at: string; resolved_at: string | null; status: string }>> {
  const limit = Math.min(opts?.limit ?? 40, 80);
  const { data, error } = await supabase
    .from("project_stakeholder_discussions")
    .select("id, title, created_at, resolved_at, status")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    title: string;
    created_at: string;
    resolved_at: string | null;
    status: string;
  }>;
}
