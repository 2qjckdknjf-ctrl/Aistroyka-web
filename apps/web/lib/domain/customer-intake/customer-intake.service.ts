import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
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

function requireNonEmptyString(value: unknown, field: string): { value: string } | { error: string } {
  if (typeof value !== "string") return { error: `${field} required` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${field} required` };
  return { value: trimmed };
}

export function parseCreateCustomerIntakeInput(
  raw: unknown
): { input: CreateCustomerIntakeInput } | { error: string } {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "Invalid body" };
  }
  const body = raw as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(body, "title")) return { error: "title required" };
  if (!Object.prototype.hasOwnProperty.call(body, "description")) return { error: "description required" };
  const title = requireNonEmptyString(body.title, "title");
  if ("error" in title) return title;
  const description = requireNonEmptyString(body.description, "description");
  if ("error" in description) return description;

  let project_id: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, "project_id")) {
    if (body.project_id === null) {
      project_id = null;
    } else if (typeof body.project_id === "string" && body.project_id.trim()) {
      project_id = body.project_id.trim();
    } else {
      return { error: "project_id must be a string or null" };
    }
  }

  return {
    input: {
      title: title.value,
      description: description.value,
      project_id,
      site_context: typeof body.site_context === "string" ? body.site_context : null,
      location:
        body.location && typeof body.location === "object" && !Array.isArray(body.location)
          ? (body.location as CreateCustomerIntakeInput["location"])
          : { precision: "city" },
      requested_work_type: typeof body.requested_work_type === "string" ? body.requested_work_type : null,
      budget_range: typeof body.budget_range === "string" ? body.budget_range : null,
      desired_start: typeof body.desired_start === "string" ? body.desired_start : null,
      desired_end: typeof body.desired_end === "string" ? body.desired_end : null,
      media_refs: Array.isArray(body.media_refs)
        ? (body.media_refs as CreateCustomerIntakeInput["media_refs"])
        : [],
      questions: Array.isArray(body.questions) ? (body.questions as string[]) : [],
    },
  };
}

async function assertProjectBelongsToTenant(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string | null | undefined
): Promise<string> {
  if (!projectId) return "";
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return "Project lookup failed";
  if (!data) return "project_id does not belong to tenant";
  return "";
}

export async function createCustomerIntakeDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  raw: unknown
): Promise<{ data: CustomerIntakeDraft | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const parsed = parseCreateCustomerIntakeInput(raw);
  if ("error" in parsed) return { data: null, error: parsed.error };
  const input = parsed.input;
  const projectErr = await assertProjectBelongsToTenant(supabase, ctx.tenantId, input.project_id);
  if (projectErr) return { data: null, error: projectErr };

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      project_id: input.project_id ?? null,
      title: input.title,
      description: input.description,
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

export async function updateCustomerIntakeDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  draftId: string,
  raw: unknown
): Promise<{ data: CustomerIntakeDraft | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!draftId) return { data: null, error: "id required" };
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { data: null, error: "Invalid body" };
  }
  const body = raw as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(body, "tenant_id")) {
    return { data: null, error: "tenant_id is immutable" };
  }
  if (Object.prototype.hasOwnProperty.call(body, "created_by")) {
    return { data: null, error: "created_by is immutable" };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = requireNonEmptyString(body.title, "title");
    if ("error" in title) return { data: null, error: title.error };
    patch.title = title.value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = requireNonEmptyString(body.description, "description");
    if ("error" in description) return { data: null, error: description.error };
    patch.description = description.value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "project_id")) {
    if (body.project_id === null) {
      patch.project_id = null;
    } else if (typeof body.project_id === "string" && body.project_id.trim()) {
      const projectErr = await assertProjectBelongsToTenant(supabase, ctx.tenantId, body.project_id.trim());
      if (projectErr) return { data: null, error: projectErr };
      patch.project_id = body.project_id.trim();
    } else {
      return { data: null, error: "project_id must be a string or null" };
    }
  }

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .update(patch)
    .eq("id", draftId)
    .eq("tenant_id", ctx.tenantId)
    .eq("created_by", ctx.userId)
    .select("*")
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Update denied" };
  return { data: asDraft(data as Record<string, unknown>), error: "" };
}

export async function listCustomerIntakeDrafts(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: CustomerIntakeDraft[]; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: [], error: "Tenant required" };
  const query = supabase
    .from("customer_intake_drafts")
    .select("*")
    .eq("tenant_id", ctx.tenantId);
  const scoped =
    ctx.role === "stakeholder" ? query.eq("created_by", ctx.userId) : query;
  const { data, error } = await scoped.order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []).map((row) => asDraft(row as Record<string, unknown>)), error: "" };
}
