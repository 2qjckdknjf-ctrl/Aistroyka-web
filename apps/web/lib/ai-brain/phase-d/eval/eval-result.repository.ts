/**
 * AI Brain Phase D — Eval result repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiVersionRef } from "../run/run.types";
import type { EvalResult } from "./eval-case.types";

export interface CreateEvalResultInput {
  evalRunId: string;
  caseId: string;
  runRecordId?: string | null;
  result: EvalResult;
  scores: Record<string, number>;
  graderOutput: string;
  warnings: string[];
  versionRefs: AiVersionRef[];
}

export async function createEvalResult(
  supabase: SupabaseClient,
  input: CreateEvalResultInput
): Promise<void> {
  await supabase.from("ai_eval_results").insert({
    eval_run_id: input.evalRunId,
    case_id: input.caseId,
    run_id: input.runRecordId ?? null,
    result: input.result,
    scores: input.scores,
    grader_output: input.graderOutput,
    warnings: input.warnings,
    version_refs: input.versionRefs,
  });
}

export interface EvalReportRow {
  eval_run_id: string;
  case_id: string;
  result: EvalResult;
  scores: Record<string, number>;
  created_at: string;
}

export async function getEvalRunReport(
  supabase: SupabaseClient,
  evalRunId: string
): Promise<EvalReportRow[]> {
  const { data, error } = await supabase
    .from("ai_eval_results")
    .select("eval_run_id, case_id, result, scores, created_at")
    .eq("eval_run_id", evalRunId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as EvalReportRow[];
}
