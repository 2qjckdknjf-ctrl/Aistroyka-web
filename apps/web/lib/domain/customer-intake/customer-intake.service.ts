import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import type { CreateCustomerIntakeInput, CustomerIntakeDraft } from "./customer-intake.types";

function asDraft(row: Record<string, unknown>): CustomerIntakeDraft {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    project_id: (row.project_id as string | null) ?? null,
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    site_context: (row.site_context as string | null) ?? null,
    location: (row.location as CustomerIntakeDraft["location"]) ?? { precision: "city" },
    requested_work_type: (row.requested_work_type as string | null) ?? null,
    budget_range: (row.budget_range as string | null) ?? null,
    desired_start: (row.desired_start as string | null) ?? null,
    desired_end: (row.desired_end as string | null) ?? null,
    media_refs: Array.isArray(row.media_refs) ? (row.media_refs as CustomerIntakeDraft["media_refs"]) : [],
    questions: Array.isArray(row.questions) ? (row.questions as string[]) : [],
    status: (row.status as CustomerIntakeDraft["status"]) ?? "draft",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function createCustomerIntakeDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateCustomerIntakeInput
): Promise<{ data: CustomerIntakeDraft | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) return { data: null, error: "title and description required" };

  const projectId = input.project_id ?? null;
  if (projectId) {
    const project = await getProjectById(supabase, projectId, ctx.tenantId);
    if (!project) return { data: null, error: "Project not found" };
  }

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      project_id: projectId,
      title,
      description,
      site_context: input.site_context ?? null,
      location: input.location ?? { precision: "city" },
      requested_work_type: input.requested_work_type ?? null,
      budget_range: input.budget_range ?? null,
      desired_start: input.desired_start ?? null,
      desired_end: input.desired_end ?? null,
      media_refs: input.media_refs ?? [],
      questions: input.questions ?? [],
      status: "draft",
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return { data: null, error: error?.message ?? "Insert failed" };
  return { data: asDraft(data as Record<string, unknown>), error: "" };
}

export async function listCustomerIntakeDrafts(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: CustomerIntakeDraft[]; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: [], error: "Tenant required" };
  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("created_by", ctx.userId)
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []).map((row) => asDraft(row as Record<string, unknown>)), error: "" };
}
