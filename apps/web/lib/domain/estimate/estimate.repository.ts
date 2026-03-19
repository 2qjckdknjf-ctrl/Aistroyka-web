import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectEstimateResult, CreateEstimateResultInput } from "./estimate.types";

const SELECT =
  "id, tenant_id, project_id, source_type, source_ref, work_categories, rough_range_min, rough_range_max, currency_hint, confidence, missing_data_reasons, assumption_notes, status, created_by, created_at, updated_at";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectEstimateResult[]> {
  const { data, error } = await supabase
    .from("project_estimate_results")
    .select(SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data ?? []).map(normalize) as unknown) as ProjectEstimateResult[];
}

export async function getLatestByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<ProjectEstimateResult | null> {
  const { data, error } = await supabase
    .from("project_estimate_results")
    .select(SELECT)
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return normalize(data) as unknown as ProjectEstimateResult;
}

export async function create(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: CreateEstimateResultInput
): Promise<ProjectEstimateResult | null> {
  const { data, error } = await supabase
    .from("project_estimate_results")
    .insert({
      tenant_id: tenantId,
      project_id: input.project_id,
      source_type: input.source_type,
      source_ref: input.source_ref ?? null,
      work_categories: input.work_categories ?? null,
      rough_range_min: input.rough_range_min ?? null,
      rough_range_max: input.rough_range_max ?? null,
      currency_hint: input.currency_hint ?? null,
      confidence: input.confidence,
      missing_data_reasons: input.missing_data_reasons ?? null,
      assumption_notes: input.assumption_notes ?? null,
      status: input.status ?? "generated",
      created_by: userId,
    })
    .select(SELECT)
    .single();
  if (error || !data) return null;
  return normalize(data) as unknown as ProjectEstimateResult;
}

function normalize(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    rough_range_min: row.rough_range_min != null ? Number(row.rough_range_min) : null,
    rough_range_max: row.rough_range_max != null ? Number(row.rough_range_max) : null,
  };
}
