import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectStakeholderRow, StakeholderRole, StakeholderStatus } from "./stakeholders.types";

const ROW =
  "id, tenant_id, project_id, email, stakeholder_role, token, status, user_id, invited_by, expires_at, accepted_at, created_at, updated_at";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getById(
  supabase: SupabaseClient,
  id: string,
  tenantId: string
): Promise<ProjectStakeholderRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select(ROW)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectStakeholderRow;
}

export async function getByToken(
  supabase: SupabaseClient,
  token: string
): Promise<ProjectStakeholderRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select(ROW)
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectStakeholderRow;
}

export async function getActiveForUserOnProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<ProjectStakeholderRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select(ROW)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectStakeholderRow;
}

/** Project IDs where user is an active external stakeholder. */
export async function listActiveProjectIdsForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select("project_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("status", "active");
  if (error || !data?.length) return [];
  return (data as { project_id: string }[]).map((r) => r.project_id);
}

export async function listByProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<ProjectStakeholderRow[]> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select(ROW)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ProjectStakeholderRow[];
}

export async function insertInvite(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    email: string;
    stakeholder_role: StakeholderRole;
    invited_by: string;
    expires_at: string;
  }
): Promise<ProjectStakeholderRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      email: normalizeEmail(row.email),
      stakeholder_role: row.stakeholder_role,
      status: "invited",
      invited_by: row.invited_by,
      expires_at: row.expires_at,
    })
    .select(ROW)
    .single();
  if (error || !data) return null;
  return data as ProjectStakeholderRow;
}

export async function updateRow(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<{
    status: StakeholderStatus;
    user_id: string | null;
    accepted_at: string | null;
  }>
): Promise<ProjectStakeholderRow | null> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select(ROW)
    .single();
  if (error || !data) return null;
  return data as ProjectStakeholderRow;
}

export { normalizeEmail };
