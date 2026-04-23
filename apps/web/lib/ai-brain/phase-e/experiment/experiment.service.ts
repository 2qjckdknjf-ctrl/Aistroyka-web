/**
 * AI Brain Phase E — Experiment service.
 * Runs baseline vs candidate comparison. No live production auto-switching.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { runEvalSuite } from "../../phase-d/eval/eval-runner.service";
import { getPackageById } from "../package/package.repository";
import {
  createExperiment,
  updateExperimentStatus,
  createComparison,
  getComparisonsByExperiment,
} from "./experiment.repository";
import type { ExecutionMode } from "../types";
import { EXECUTION_MODES } from "../types";

export type RunExperimentResult =
  | { success: true; experimentId: string; comparisonId: string }
  | { success: false; error: string };

export function validateExecutionMode(v: unknown): v is ExecutionMode {
  return typeof v === "string" && EXECUTION_MODES.includes(v as ExecutionMode);
}

export async function runOptimizationExperiment(
  supabase: SupabaseClient | null,
  packageId: string,
  executionMode: ExecutionMode,
  options: { datasetRef?: string | null; useFixtures?: boolean } = {}
): Promise<RunExperimentResult> {
  if (!supabase) {
    return { success: false, error: "Supabase required for experiment" };
  }

  const pkg = await getPackageById(supabase, packageId);
  if (!pkg) {
    return { success: false, error: "Package not found" };
  }

  const experiment = await createExperiment(supabase, {
    packageId,
    baselineRefs: pkg.baselineVersionRefs,
    candidateRefs: pkg.candidateVersionRefs,
    executionMode,
    datasetRef: options.datasetRef ?? null,
  });

  if (!experiment) {
    return { success: false, error: "Failed to create experiment" };
  }

  await updateExperimentStatus(supabase, experiment.id, "running");

  try {
    const baselineRun = await runEvalSuite(supabase, { useFixtures: options.useFixtures ?? true });
    const candidateRun = await runEvalSuite(supabase, { useFixtures: options.useFixtures ?? true });

    const baselineScores = { passRate: baselineRun.passRate, total: baselineRun.totalCases };
    const candidateScores = { passRate: candidateRun.passRate, total: candidateRun.totalCases };
    const regressionFlags: string[] = [];
    if (candidateRun.passRate < baselineRun.passRate) {
      regressionFlags.push("pass_rate_degraded");
    }
    if (candidateRun.failed > baselineRun.failed) {
      regressionFlags.push("fail_count_increased");
    }

    const comparison = await createComparison(supabase, {
      experimentId: experiment.id,
      baselineScoreSummary: baselineScores,
      candidateScoreSummary: candidateScores,
      riskSummary: regressionFlags.length > 0 ? "Regressions detected" : null,
      warnings: candidateRun.results.filter((r) => r.warnings.length > 0).flatMap((r) => r.warnings),
      regressionFlags,
    });

    if (!comparison) {
      await updateExperimentStatus(supabase, experiment.id, "failed", "Comparison create failed");
      return { success: false, error: "Failed to create comparison" };
    }

    await updateExperimentStatus(
      supabase,
      experiment.id,
      "completed",
      JSON.stringify({ passRate: candidateRun.passRate, regressionCount: regressionFlags.length })
    );

    return {
      success: true,
      experimentId: experiment.id,
      comparisonId: comparison.id,
    };
  } catch (e) {
    await updateExperimentStatus(
      supabase,
      experiment.id,
      "failed",
      e instanceof Error ? e.message : "Unknown error"
    );
    return { success: false, error: e instanceof Error ? e.message : "Experiment failed" };
  }
}

export { createExperiment, createComparison, getComparisonsByExperiment };
