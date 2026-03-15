import type { SupabaseClient } from "@supabase/supabase-js";
import { getAssignedTaskIds } from "@/lib/domain/task-assignments";
import type { Task, CreateTaskInput, UpdateTaskInput } from "./task.types";

const TASK_SELECT =
  "id, project_id, title, description, status, assigned_to, due_date, milestone_id, required_photos, report_required, created_at, updated_at";

/**
 * List tasks assigned to user: worker_tasks.assigned_to = user OR task in task_assignments.
 * Due date <= today (or overdue), status pending/in_progress.
 */
export async function listTasksForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);
  const assignedIds = await getAssignedTaskIds(supabase, tenantId, userId);
  const base = supabase
    .from("worker_tasks")
    .select(TASK_SELECT)
    .eq("tenant_id", tenantId)
    .lte("due_date", today)
    .in("status", ["pending", "in_progress"]);
  const { data: byAssignedTo, error: e1 } = await base.eq("assigned_to", userId);
  if (e1) return [];
  const fromLegacy = (byAssignedTo ?? []) as Task[];
  if (assignedIds.length === 0) return fromLegacy;
  const legacyIds = new Set(fromLegacy.map((t) => t.id));
  const extraIds = assignedIds.filter((id) => !legacyIds.has(id));
  if (extraIds.length === 0) return fromLegacy;
  const { data: byTable, error: e2 } = await supabase
    .from("worker_tasks")
    .select(TASK_SELECT)
    .eq("tenant_id", tenantId)
    .in("id", extraIds)
    .lte("due_date", today)
    .in("status", ["pending", "in_progress"])
    .order("due_date", { ascending: true });
  if (e2 || !byTable?.length) return fromLegacy;
  let combined = [...fromLegacy, ...(byTable as Task[])];
  combined.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  const taskIds = combined.map((t) => t.id);
  if (taskIds.length > 0) {
    const { data: reportRows } = await supabase
      .from("worker_reports")
      .select("task_id, id, status")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .in("task_id", taskIds)
      .order("created_at", { ascending: false });
    const byTask = new Map<string, { report_id: string; report_status: string }>();
    for (const row of (reportRows ?? []) as { task_id: string; id: string; status: string }[]) {
      if (row.task_id && !byTask.has(row.task_id)) byTask.set(row.task_id, { report_id: row.id, report_status: row.status });
    }
    combined = combined.map((t) => {
      const link = byTask.get(t.id);
      return link ? { ...t, report_id: link.report_id, report_status: link.report_status } : t;
    });
  }
  return combined;
}

/** Get task by id and tenant. */
export async function getById(
  supabase: SupabaseClient,
  taskId: string,
  tenantId: string
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("worker_tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Task;
}

/** Create task (manager). */
export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  input: CreateTaskInput
): Promise<Task | null> {
  const dueDate = input.due_at ? input.due_at.slice(0, 10) : null;
  const { data, error } = await supabase
    .from("worker_tasks")
    .insert({
      tenant_id: tenantId,
      project_id: input.project_id || null,
      title: input.title,
      description: input.description ?? null,
      due_date: dueDate,
      milestone_id: input.milestone_id ?? null,
      status: "pending",
      required_photos: input.required_photos ?? {},
      report_required: input.report_required ?? true,
    })
    .select(TASK_SELECT)
    .single();
  if (error || !data) return null;
  return data as Task;
}

/** Update task (manager). */
export async function update(
  supabase: SupabaseClient,
  taskId: string,
  tenantId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.due_at !== undefined) payload.due_date = input.due_at ? input.due_at.slice(0, 10) : null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.required_photos !== undefined) payload.required_photos = input.required_photos;
  if (input.report_required !== undefined) payload.report_required = input.report_required;
  const { data, error } = await supabase
    .from("worker_tasks")
    .update(payload)
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .select(TASK_SELECT)
    .single();
  if (error || !data) return null;
  return data as Task;
}

/** List tasks for manager (tenant-scoped, optional filters). */
export interface ListTasksFilters {
  project_id?: string;
  from?: string;
  to?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ListTasksResult {
  data: Task[];
  total: number;
}

export async function list(
  supabase: SupabaseClient,
  tenantId: string,
  filters: ListTasksFilters
): Promise<ListTasksResult> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = Math.max(0, filters.offset ?? 0);
  let q = supabase
    .from("worker_tasks")
    .select("id, project_id, title, description, status, assigned_to, due_date, milestone_id, required_photos, report_required, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (filters.project_id?.trim()) q = q.eq("project_id", filters.project_id.trim());
  if (filters.from?.trim()) q = q.gte("due_date", filters.from.trim().slice(0, 10));
  if (filters.to?.trim()) q = q.lte("due_date", filters.to.trim().slice(0, 10));
  if (filters.status?.trim()) q = q.eq("status", filters.status.trim());
  if (filters.q?.trim()) {
    const qs = filters.q.trim();
    if (qs.length >= 1) {
      if (/^[0-9a-f-]{1,36}$/i.test(qs)) q = q.ilike("id", `${qs}%`);
      else q = q.ilike("title", `%${qs.replace(/[%_\\]/g, (c) => (c === "\\" ? "\\\\" : `\\${c}`))}%`);
    }
  }
  const { data, error, count } = await q;
  if (error) return { data: [], total: 0 };
  const rows = (data ?? []) as Task[];
  const linkedReportIds = new Set<string>();
  for (const t of rows) linkedReportIds.add(t.id);
  if (rows.length > 0) {
    const { data: reportRows } = await supabase
      .from("worker_reports")
      .select("task_id, id, status")
      .eq("tenant_id", tenantId)
      .in("task_id", rows.map((r) => r.id));
    const byTask = new Map<string, { report_id: string; report_status: string }>();
    for (const row of (reportRows ?? []) as { task_id: string; id: string; status: string }[]) {
      if (row.task_id && !byTask.has(row.task_id)) byTask.set(row.task_id, { report_id: row.id, report_status: row.status });
    }
    const withReports = rows.map((t) => {
      const link = byTask.get(t.id);
      return link ? { ...t, report_id: link.report_id, report_status: link.report_status } : t;
    });
    return { data: withReports, total: count ?? rows.length };
  }
  return { data: [], total: count ?? 0 };
}

/** Get task by id with linked report info (for detail). */
export async function getByIdWithReports(
  supabase: SupabaseClient,
  taskId: string,
  tenantId: string
): Promise<Task | null> {
  const task = await getById(supabase, taskId, tenantId);
  if (!task) return null;
  const { data: reportRow } = await supabase
    .from("worker_reports")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = reportRow as { id: string; status: string } | null;
  if (row?.id) return { ...task, report_id: row.id, report_status: row.status };
  return task;
}
