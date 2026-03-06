import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadTasks, canManageTasks } from "./task.policy";
import * as repo from "./task.repository";
import type { Task, CreateTaskInput, UpdateTaskInput } from "./task.types";
import * as assignRepo from "@/lib/domain/task-assignments/task-assignments.repository";

export async function listTasksForToday(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId?: string | null
): Promise<{ data: Task[]; error: string | null }> {
  if (!canReadTasks(ctx)) return { data: [], error: "Insufficient rights" };
  try {
    let data = await repo.listTasksForUser(supabase, ctx.tenantId, ctx.userId);
    if (projectId && projectId.trim()) {
      data = data.filter((t) => t.project_id === projectId.trim());
    }
    return { data, error: null };
  } catch {
    return { data: [], error: null };
  }
}

export async function createTask(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateTaskInput
): Promise<{ data: Task | null; error: string }> {
  if (!canManageTasks(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  const task = await repo.create(supabase, ctx.tenantId, input);
  return task ? { data: task, error: "" } : { data: null, error: "Create failed" };
}

export async function updateTask(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string,
  input: UpdateTaskInput
): Promise<{ data: Task | null; error: string }> {
  if (!canManageTasks(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  const task = await repo.update(supabase, taskId, ctx.tenantId, input);
  return task ? { data: task, error: "" } : { data: null, error: "Not found or update failed" };
}

export async function assignTask(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string,
  workerId: string
): Promise<{ error: string }> {
  if (!canManageTasks(ctx)) return { error: "Insufficient rights" };
  if (!ctx.tenantId || !ctx.userId) return { error: "Tenant and user required" };
  const ok = await assignRepo.assign(supabase, ctx.tenantId, taskId, workerId, ctx.userId);
  return ok ? { error: "" } : { error: "Assign failed" };
}

export async function listTasks(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: repo.ListTasksFilters
): Promise<{ data: Task[]; total: number; error: string }> {
  if (!canManageTasks(ctx)) return { data: [], total: 0, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: [], total: 0, error: "Tenant required" };
  const { data, total } = await repo.list(supabase, ctx.tenantId, filters);
  return { data, total, error: "" };
}

export async function getTaskById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  taskId: string
): Promise<{ data: Task | null; error: string }> {
  if (!canManageTasks(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  const task = await repo.getByIdWithReports(supabase, taskId, ctx.tenantId);
  return { data: task ?? null, error: task ? "" : "Not found" };
}
