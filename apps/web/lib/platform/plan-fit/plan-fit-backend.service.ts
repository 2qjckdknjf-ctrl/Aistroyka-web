/**
 * Plan-fit backend services: submit recommendation, select plan, get state.
 * Recommendation != selection. Selected plan != billing subscription.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode, AddOnCode } from "@aistroyka/contracts";
import { recommendPlan } from "./recommend";
import type { RecommendPlanInput, RecommendPlanOutput } from "./recommend.types";
import { createPlanRecommendation, getLatestPlanRecommendationForWorkspace } from "./persistence/plan-fit-recommendation.repository";
import {
  getWorkspaceSelectedPlanState,
  upsertWorkspaceSelectedPlanState,
} from "./persistence/workspace-plan-state.repository";
import type { WorkspacePlanStateSourceKind } from "./persistence/plan-fit.types";
import { isAddOnAllowedForPlan } from "./add-on-rules";
import { ADD_ON_CODES } from "./add-ons";

export class PlanFitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanFitValidationError";
  }
}

export class PlanFitNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanFitNotFoundError";
  }
}

const VALID_PLAN_CODES: PlanCode[] = [
  "client_personal",
  "team_contractor",
  "business_operations",
  "enterprise",
];

function isValidPlanCode(code: string): code is PlanCode {
  return VALID_PLAN_CODES.includes(code as PlanCode);
}

function filterValidAddOns(planCode: PlanCode, codes: AddOnCode[]): AddOnCode[] {
  return codes.filter((c) => ADD_ON_CODES.includes(c) && isAddOnAllowedForPlan(planCode, c));
}

export interface SubmitPlanFitRecommendationInput {
  tenantId: string;
  userId: string | null;
  input: RecommendPlanInput;
}

export interface SubmitPlanFitRecommendationResult {
  recommendation: RecommendPlanOutput;
  id: string;
  createdAt: string;
}

/**
 * Run recommendation, persist record, return result. Does not change selected plan.
 */
export async function submitPlanFitRecommendation(
  supabase: SupabaseClient,
  input: SubmitPlanFitRecommendationInput
): Promise<{ data: SubmitPlanFitRecommendationResult; error: string | null }> {
  const recommendation = recommendPlan(input.input);
  const { data, error } = await createPlanRecommendation(supabase, {
    tenantId: input.tenantId,
    userId: input.userId,
    inputSnapshot: input.input,
    recommendedPlanCode: recommendation.recommendedPlanCode,
    alternativePlanCodes: recommendation.alternativePlanCodes,
    enterpriseSignal: recommendation.enterpriseSignal,
    reasoningCodes: recommendation.reasoningCodes,
  });
  if (error) return { data: null as never, error };
  return {
    data: {
      recommendation,
      id: data!.id,
      createdAt: data!.createdAt,
    },
    error: null,
  };
}

export interface SelectWorkspacePlanInput {
  tenantId: string;
  canonicalPlanCode: PlanCode;
  sourceKind?: WorkspacePlanStateSourceKind;
  selectedByUserId?: string | null;
  addOnCodes?: AddOnCode[];
}

/**
 * Validate plan and add-ons, persist selected plan state. Idempotent upsert.
 */
export async function selectWorkspacePlan(
  supabase: SupabaseClient,
  input: SelectWorkspacePlanInput
): Promise<{ data: { tenantId: string; canonicalPlanCode: PlanCode; selectedAt: string }; error: string | null }> {
  if (!isValidPlanCode(input.canonicalPlanCode)) {
    return { data: null as never, error: "Invalid canonical plan code" };
  }
  const addOnCodes = input.addOnCodes
    ? filterValidAddOns(input.canonicalPlanCode, input.addOnCodes)
    : [];
  const { data, error } = await upsertWorkspaceSelectedPlanState(supabase, {
    tenantId: input.tenantId,
    canonicalPlanCode: input.canonicalPlanCode,
    sourceKind: input.sourceKind ?? "manual_backend_set",
    selectedByUserId: input.selectedByUserId ?? null,
    addOnCodes,
  });
  if (error) return { data: null as never, error };
  return {
    data: {
      tenantId: data!.tenantId,
      canonicalPlanCode: data!.canonicalPlanCode,
      selectedAt: data!.selectedAt,
    },
    error: null,
  };
}

/**
 * Get persisted selected plan state for workspace. Null if never set.
 */
export async function getWorkspaceSelectedPlan(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ data: Awaited<ReturnType<typeof getWorkspaceSelectedPlanState>>; error: string | null }> {
  const data = await getWorkspaceSelectedPlanState(supabase, tenantId);
  return { data, error: null };
}

/**
 * Get latest recommendation record for workspace. Null if none.
 */
export async function getWorkspaceLatestPlanRecommendation(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ data: Awaited<ReturnType<typeof getLatestPlanRecommendationForWorkspace>>; error: string | null }> {
  const data = await getLatestPlanRecommendationForWorkspace(supabase, tenantId);
  return { data, error: null };
}
