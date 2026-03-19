import type { SupabaseClient } from "@supabase/supabase-js";
import { getBudgetSummary } from "@/lib/domain/costs/cost.repository";
import { listByProject as listDocumentsByProject } from "@/lib/domain/documents/document.repository";
import {
  listByProject as listEstimateResultsByProject,
  getLatestByProject,
  create as createEstimateResult,
} from "@/lib/domain/estimate/estimate.repository";
import type { ProjectEstimateSummary, CreateEstimateResultInput } from "@/lib/domain/estimate/estimate.types";

export interface EstimateSummaryContext {
  projectId: string;
  tenantId: string;
}

export async function getProjectEstimateSummary(
  supabase: SupabaseClient,
  ctx: EstimateSummaryContext
): Promise<ProjectEstimateSummary> {
  const [budgetSummary, latest, estimateResults, documents] = await Promise.all([
    getBudgetSummary(supabase, ctx.projectId, ctx.tenantId),
    getLatestByProject(supabase, ctx.projectId, ctx.tenantId),
    listEstimateResultsByProject(supabase, ctx.projectId, ctx.tenantId),
    listDocumentsByProject(supabase, ctx.projectId, ctx.tenantId),
  ]);

  return {
    project_id: ctx.projectId,
    tenant_id: ctx.tenantId,
    budget_summary: budgetSummary,
    latest_estimate_result: latest,
    estimate_results: estimateResults,
    source_documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      status: d.status,
    })),
  };
}

export async function createResult(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  input: CreateEstimateResultInput
) {
  return createEstimateResult(supabase, tenantId, userId, input);
}
