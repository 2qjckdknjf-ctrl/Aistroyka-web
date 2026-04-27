/**
 * Plan-fit recommendation persistence. Tenant-scoped.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import type { PlanFitRecommendationRow, PlanFitRecommendationDTO } from "./plan-fit.types";

function rowToDto(row: PlanFitRecommendationRow): PlanFitRecommendationDTO {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id ?? null,
    inputSnapshot: row.input_snapshot,
    recommendedPlanCode: row.recommended_plan_code as PlanCode,
    alternativePlanCodes: Array.isArray(row.alternative_plan_codes) ? (row.alternative_plan_codes as PlanCode[]) : [],
    enterpriseSignal: row.enterprise_signal,
    reasoningCodes: Array.isArray(row.reasoning_codes) ? (row.reasoning_codes as string[]) : [],
    createdAt: row.created_at,
  };
}

export interface CreatePlanRecommendationInput {
  tenantId: string;
  userId: string | null;
  inputSnapshot: unknown;
  recommendedPlanCode: PlanCode;
  alternativePlanCodes: PlanCode[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
}

export async function createPlanRecommendation(
  supabase: SupabaseClient,
  input: CreatePlanRecommendationInput
): Promise<{ data: PlanFitRecommendationDTO | null; error: string | null }> {
  const { data, error } = await supabase
    .from("plan_fit_recommendations")
    .insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      input_snapshot: input.inputSnapshot ?? {},
      recommended_plan_code: input.recommendedPlanCode,
      alternative_plan_codes: input.alternativePlanCodes,
      enterprise_signal: input.enterpriseSignal,
      reasoning_codes: input.reasoningCodes,
    })
    .select("id, tenant_id, user_id, input_snapshot, recommended_plan_code, alternative_plan_codes, enterprise_signal, reasoning_codes, created_at")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToDto(data as PlanFitRecommendationRow), error: null };
}

export async function getLatestPlanRecommendationForWorkspace(
  supabase: SupabaseClient,
  tenantId: string
): Promise<PlanFitRecommendationDTO | null> {
  const { data, error } = await supabase
    .from("plan_fit_recommendations")
    .select("id, tenant_id, user_id, input_snapshot, recommended_plan_code, alternative_plan_codes, enterprise_signal, reasoning_codes, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDto(data as PlanFitRecommendationRow);
}
