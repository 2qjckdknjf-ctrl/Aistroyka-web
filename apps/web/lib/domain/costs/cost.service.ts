import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import * as repo from "./cost.repository";
import type {
  ProjectCostItem,
  ProjectBudgetSummary,
  CreateCostItemInput,
  UpdateCostItemInput,
} from "./cost.types";

const VALID_CATEGORIES = ["materials", "labor", "equipment", "services", "other"];
const VALID_STATUSES = ["planned", "committed", "incurred", "approved", "archived"] as const;

export async function listCostItems(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectCostItem[]; error: string }> {
  if (!canReadProjects(ctx)) return { data: [], error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: [], error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: [], error: "Project not found" };

  const data = await repo.listByProject(supabase, projectId, ctx.tenantId);
  return { data, error: "" };
}

export async function getBudgetSummary(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string
): Promise<{ data: ProjectBudgetSummary | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const data = await repo.getBudgetSummary(supabase, projectId, ctx.tenantId);
  return { data, error: "" };
}

export async function getCostItemById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  costItemId: string,
  projectId: string
): Promise<{ data: ProjectCostItem | null; error: string }> {
  if (!canReadProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const item = await repo.getById(supabase, costItemId, ctx.tenantId);
  if (!item || item.project_id !== projectId)
    return { data: null, error: "Cost item not found" };

  return { data: item, error: "" };
}

export async function createCostItem(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateCostItemInput
): Promise<{ data: ProjectCostItem | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };
  if (!ctx.userId) return { data: null, error: "User required" };

  const project = await getProjectById(supabase, input.project_id, ctx.tenantId);
  if (!project) return { data: null, error: "Project not found" };

  const title = input.title?.trim();
  if (!title) return { data: null, error: "title required" };

  const planned = Number(input.planned_amount);
  if (isNaN(planned) || planned < 0)
    return { data: null, error: "planned_amount must be >= 0" };

  const category = (input.category?.trim() || "other").toLowerCase();
  const safeCategory = VALID_CATEGORIES.includes(category) ? category : "other";

  const data = await repo.create(supabase, ctx.tenantId, ctx.userId, {
    ...input,
    title,
    planned_amount: planned,
    category: safeCategory,
  });
  return data ? { data, error: "" } : { data: null, error: "Create failed" };
}

export async function updateCostItem(
  supabase: SupabaseClient,
  ctx: TenantContext,
  costItemId: string,
  projectId: string,
  input: UpdateCostItemInput
): Promise<{ data: ProjectCostItem | null; error: string }> {
  if (!canManageProjects(ctx)) return { data: null, error: "Insufficient rights" };
  if (!ctx.tenantId) return { data: null, error: "Tenant required" };

  const existing = await repo.getById(supabase, costItemId, ctx.tenantId);
  if (!existing || existing.project_id !== projectId)
    return { data: null, error: "Cost item not found" };

  if (input.planned_amount !== undefined && (isNaN(Number(input.planned_amount)) || Number(input.planned_amount) < 0))
    return { data: null, error: "planned_amount must be >= 0" };
  if (input.actual_amount !== undefined && (isNaN(Number(input.actual_amount)) || Number(input.actual_amount) < 0))
    return { data: null, error: "actual_amount must be >= 0" };

  let updateInput: UpdateCostItemInput = input;
  if (input.category !== undefined) {
    const cat = (input.category.trim() || "other").toLowerCase();
    updateInput = { ...input, category: VALID_CATEGORIES.includes(cat) ? cat : "other" };
  }

  if (updateInput.status !== undefined && !VALID_STATUSES.includes(updateInput.status))
    return { data: null, error: "Invalid status" };

  const data = await repo.update(supabase, costItemId, ctx.tenantId, updateInput);
  return data ? { data, error: "" } : { data: null, error: "Update failed" };
}
