/**
 * AI Brain Phase E — Experiment and comparison repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiVersionRef } from "../../phase-d/run/run.types";
import type {
  AiOptimizationExperiment,
  AiOptimizationComparison,
  ExecutionMode,
  ExperimentStatus,
} from "../types";

export interface CreateExperimentInput {
  packageId: string;
  baselineRefs?: AiVersionRef[];
  candidateRefs?: AiVersionRef[];
  executionMode: ExecutionMode;
  datasetRef?: string | null;
}

export async function createExperiment(
  supabase: SupabaseClient,
  input: CreateExperimentInput
): Promise<AiOptimizationExperiment | null> {
  const { data, error } = await supabase
    .from("ai_optimization_experiments")
    .insert({
      package_id: input.packageId,
      baseline_refs: (input.baselineRefs ?? []) as unknown[],
      candidate_refs: (input.candidateRefs ?? []) as unknown[],
      execution_mode: input.executionMode,
      dataset_ref: input.datasetRef ?? null,
      status: "pending",
    })
    .select("id, package_id, baseline_refs, candidate_refs, execution_mode, dataset_ref, started_at, ended_at, result_summary, status")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    packageId: d.package_id as string,
    baselineRefs: (d.baseline_refs as AiVersionRef[]) ?? [],
    candidateRefs: (d.candidate_refs as AiVersionRef[]) ?? [],
    executionMode: d.execution_mode as ExecutionMode,
    datasetRef: (d.dataset_ref as string) ?? null,
    startedAt: d.started_at as string,
    endedAt: (d.ended_at as string) ?? null,
    resultSummary: (d.result_summary as string) ?? null,
    status: (d.status as ExperimentStatus) ?? "pending",
  };
}

export async function updateExperimentStatus(
  supabase: SupabaseClient,
  experimentId: string,
  status: ExperimentStatus,
  resultSummary?: string | null
): Promise<void> {
  await supabase
    .from("ai_optimization_experiments")
    .update({
      status,
      ended_at: status === "completed" || status === "failed" ? new Date().toISOString() : undefined,
      result_summary: resultSummary ?? undefined,
    })
    .eq("id", experimentId);
}

export interface CreateComparisonInput {
  experimentId: string;
  baselineScoreSummary: Record<string, number>;
  candidateScoreSummary: Record<string, number>;
  deltaSummary?: Record<string, number>;
  riskSummary?: string | null;
  warnings?: string[];
  regressionFlags?: string[];
}

export async function createComparison(
  supabase: SupabaseClient,
  input: CreateComparisonInput
): Promise<AiOptimizationComparison | null> {
  const delta = input.deltaSummary ?? {};
  for (const k of Object.keys(input.candidateScoreSummary)) {
    const b = input.baselineScoreSummary[k] ?? 0;
    const c = input.candidateScoreSummary[k] ?? 0;
    delta[k] = c - b;
  }

  const { data, error } = await supabase
    .from("ai_optimization_comparisons")
    .insert({
      experiment_id: input.experimentId,
      baseline_score_summary: input.baselineScoreSummary as unknown,
      candidate_score_summary: input.candidateScoreSummary as unknown,
      delta_summary: delta as unknown,
      risk_summary: input.riskSummary ?? null,
      warnings: input.warnings ?? [],
      regression_flags: input.regressionFlags ?? [],
    })
    .select("id, experiment_id, baseline_score_summary, candidate_score_summary, delta_summary, risk_summary, warnings, regression_flags, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    experimentId: d.experiment_id as string,
    baselineScoreSummary: (d.baseline_score_summary as Record<string, number>) ?? {},
    candidateScoreSummary: (d.candidate_score_summary as Record<string, number>) ?? {},
    deltaSummary: (d.delta_summary as Record<string, number>) ?? {},
    riskSummary: (d.risk_summary as string) ?? null,
    warnings: (d.warnings as string[]) ?? [],
    regressionFlags: (d.regression_flags as string[]) ?? [],
    createdAt: d.created_at as string,
  };
}

export async function getComparisonsByExperiment(
  supabase: SupabaseClient,
  experimentId: string
): Promise<AiOptimizationComparison[]> {
  const { data, error } = await supabase
    .from("ai_optimization_comparisons")
    .select("*")
    .eq("experiment_id", experimentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((d) => ({
    id: d.id as string,
    experimentId: d.experiment_id as string,
    baselineScoreSummary: (d.baseline_score_summary as Record<string, number>) ?? {},
    candidateScoreSummary: (d.candidate_score_summary as Record<string, number>) ?? {},
    deltaSummary: (d.delta_summary as Record<string, number>) ?? {},
    riskSummary: (d.risk_summary as string) ?? null,
    warnings: (d.warnings as string[]) ?? [],
    regressionFlags: (d.regression_flags as string[]) ?? [],
    createdAt: d.created_at as string,
  }));
}
