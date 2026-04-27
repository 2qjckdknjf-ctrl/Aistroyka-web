/**
 * AI Brain Phase D — Eval runner service.
 * Runs eval suites, grades outputs, records results, degrades safely when deps unavailable.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { captureVersionRefs } from "../versioning/version-refs";
import { logPhaseDEvalRunComplete, logPhaseDEvalCaseSkipped } from "../telemetry/phase-d-telemetry";
import { listEvalCases } from "./eval-case.registry";
import { gradeOutput } from "./grader";
import { createEvalResult } from "./eval-result.repository";
import { FIXTURE_OUTPUTS } from "./fixture-outputs";
import type { AiEvalCase } from "./eval-case.types";
import type {
  EvalRunConfig,
  EvalCaseResult,
  EvalRunSummary,
} from "./eval-runner.types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(s: string): boolean {
  return UUID_REGEX.test(s);
}

function generateEvalRunId(): string {
  return `eval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOutputForCase(
  caseDef: AiEvalCase,
  config: EvalRunConfig
): { output: unknown; skipped: boolean } {
  if (config.outputs?.[caseDef.id]) {
    return { output: config.outputs[caseDef.id], skipped: false };
  }
  if (config.useFixtures) {
    const fixture = FIXTURE_OUTPUTS[caseDef.title];
    if (fixture) return { output: fixture, skipped: false };
  }
  return { output: null, skipped: true };
}

export async function runEvalSuite(
  supabase: SupabaseClient | null,
  config: EvalRunConfig
): Promise<EvalRunSummary> {
  const startMs = Date.now();
  const evalRunId = generateEvalRunId();
  const versionRefs = captureVersionRefs();

  const cases = await listEvalCases(supabase, {
    mode: config.mode,
    active: true,
    tags: undefined,
  });

  let filtered = cases;
  if (config.caseIds?.length) {
    filtered = cases.filter((c) => config.caseIds!.includes(c.id));
  }

  const results: EvalCaseResult[] = [];
  let passed = 0;
  let failed = 0;
  let partial = 0;
  let skipped = 0;

  for (const caseDef of filtered) {
    const { output, skipped: caseSkipped } = getOutputForCase(caseDef, config);

    if (caseSkipped) {
      skipped++;
      results.push({
        caseId: caseDef.id,
        caseTitle: caseDef.title,
        result: "partial",
        scores: {},
        graderOutput: "Skipped: no output available",
        warnings: ["No output provided; use fixtures or pass outputs in config"],
        versionRefs,
      });
      if (supabase && isValidUuid(caseDef.id)) {
        await createEvalResult(supabase, {
          evalRunId,
          caseId: caseDef.id,
          result: "partial",
          scores: {},
          graderOutput: "Skipped: no output available",
          warnings: ["No output provided"],
          versionRefs,
        });
      }
      continue;
    }

    const graded = gradeOutput(caseDef, output);
    if (graded.result === "pass") passed++;
    else if (graded.result === "fail") failed++;
    else partial++;

    const caseResult: EvalCaseResult = {
      caseId: caseDef.id,
      caseTitle: caseDef.title,
      result: graded.result,
      scores: graded.scores,
      graderOutput: JSON.stringify(graded),
      warnings: graded.warnings,
      versionRefs,
    };
    results.push(caseResult);

    if (supabase && isValidUuid(caseDef.id)) {
      await createEvalResult(supabase, {
        evalRunId,
        caseId: caseDef.id,
        result: graded.result,
        scores: graded.scores,
        graderOutput: caseResult.graderOutput,
        warnings: graded.warnings,
        versionRefs,
      });
    }
  }

  const totalGraded = passed + failed + partial;
  const passRate = totalGraded > 0 ? passed / totalGraded : 0;

  logPhaseDEvalRunComplete({
    evalRunId,
    totalCases: filtered.length,
    passed,
    failed,
    partial,
    skipped,
    passRate,
    durationMs: Date.now() - startMs,
  });

  return {
    evalRunId,
    totalCases: filtered.length,
    passed,
    failed,
    partial,
    skipped,
    passRate,
    durationMs: Date.now() - startMs,
    results,
  };
}
