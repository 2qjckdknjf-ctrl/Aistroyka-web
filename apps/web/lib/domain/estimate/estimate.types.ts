/** Estimate result source: image, budget snapshot, or assumption. */
export type EstimateSourceType = "image" | "budget_snapshot" | "assumption";

/** Confidence level for estimate. */
export type EstimateConfidence = "low" | "medium" | "high";

export type EstimateResultStatus = "draft" | "generated" | "reviewed";

export interface ProjectEstimateResult {
  id: string;
  tenant_id: string;
  project_id: string;
  source_type: EstimateSourceType;
  source_ref: Record<string, unknown> | null;
  work_categories: string[] | null;
  rough_range_min: number | null;
  rough_range_max: number | null;
  currency_hint: string | null;
  confidence: EstimateConfidence;
  missing_data_reasons: string[] | null;
  assumption_notes: string | null;
  status: EstimateResultStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEstimateResultInput {
  project_id: string;
  source_type: EstimateSourceType;
  source_ref?: Record<string, unknown> | null;
  work_categories?: string[] | null;
  rough_range_min?: number | null;
  rough_range_max?: number | null;
  currency_hint?: string | null;
  confidence: EstimateConfidence;
  missing_data_reasons?: string[] | null;
  assumption_notes?: string | null;
  status?: EstimateResultStatus;
}

/** Project estimate summary for manager: budget + latest estimate result(s) + sources. */
export interface ProjectEstimateSummary {
  project_id: string;
  tenant_id: string;
  budget_summary: {
    planned_total: number;
    actual_total: number;
    variance_amount: number;
    currency: string;
    over_budget: boolean;
    item_count: number;
  } | null;
  latest_estimate_result: ProjectEstimateResult | null;
  estimate_results: ProjectEstimateResult[];
  source_documents: { id: string; title: string; type: string; status: string }[];
}

/** Parsed cost vision output from AI (before persistence). */
export interface CostVisionOutput {
  work_categories: string[];
  rough_range_min: number | null;
  rough_range_max: number | null;
  currency_hint: string | null;
  confidence: EstimateConfidence;
  missing_data_reasons: string[];
  assumption_notes: string | null;
}
