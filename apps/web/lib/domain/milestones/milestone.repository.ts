import type { SupabaseClient } from "@supabase/supabase-js";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "./milestone.types";

const MILESTONE_SELECT =
  "id, project_id, tenant_id, title, description, target_date, status, sort_order, created_at, updated_at";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("project_milestones")
    .select(MILESTONE_SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("target_date", { ascending: true });
  if (error) return [];
  return (data ?? []) as Milestone[];
}

export async function getById(
  supabase: SupabaseClient,
  milestoneId: string,
  tenantId: string
): Promise<Milestone | null> {
  const { data, error } = await supabase
    .from("project_milestones")
    .select(MILESTONE_SELECT)
    .eq("id", milestoneId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Milestone;
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  input: CreateMilestoneInput
): Promise<Milestone | null> {
  const targetDate = input.target_date?.slice(0, 10) ?? null;
  if (!targetDate) return null;

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: input.project_id,
      tenant_id: tenantId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      target_date: targetDate,
      status: input.status ?? "pending",
      sort_order: input.sort_order ?? 0,
    })
    .select(MILESTONE_SELECT)
    .single();
  if (error || !data) return null;
  return data as Milestone;
}

export async function update(
  supabase: SupabaseClient,
  milestoneId: string,
  tenantId: string,
  input: UpdateMilestoneInput
): Promise<Milestone | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.target_date !== undefined) payload.target_date = input.target_date?.slice(0, 10) ?? null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("project_milestones")
    .update(payload)
    .eq("id", milestoneId)
    .eq("tenant_id", tenantId)
    .select(MILESTONE_SELECT)
    .single();
  if (error || !data) return null;
  return data as Milestone;
}

/** Count tasks linked to milestone. */
export async function countLinkedTasks(
  supabase: SupabaseClient,
  milestoneId: string,
  tenantId: string
): Promise<{ total: number; done: number }> {
  const { data, error } = await supabase
    .from("worker_tasks")
    .select("id, status")
    .eq("milestone_id", milestoneId)
    .eq("tenant_id", tenantId);
  if (error) return { total: 0, done: 0 };
  const tasks = (data ?? []) as { id: string; status: string }[];
  const done = tasks.filter((t) => t.status === "done").length;
  return { total: tasks.length, done };
}
