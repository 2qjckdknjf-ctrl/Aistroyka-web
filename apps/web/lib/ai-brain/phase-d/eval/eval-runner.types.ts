/**
 * AI Brain Phase D — Eval runner types.
 */

import type { AiEvalCase } from "./eval-case.types";
import type { AiVersionRef } from "../run/run.types";
import type { EvalResult } from "./eval-case.types";

export interface EvalRunConfig {
  /** Filter cases by mode. */
  mode?: string;
  /** Specific case IDs. */
  caseIds?: string[];
  /** Use fixture outputs when live deps unavailable. */
  useFixtures?: boolean;
  /** Pre-captured outputs keyed by case id (for offline grading). */
  outputs?: Record<string, unknown>;
}

export interface GraderOutput {
  result: EvalResult;
  scores: Record<string, number>;
  warnings: string[];
}

export interface EvalCaseResult {
  caseId: string;
  caseTitle: string;
  result: EvalResult;
  scores: Record<string, number>;
  graderOutput: string;
  warnings: string[];
  versionRefs: AiVersionRef[];
  runRecordId?: string | null;
}

export interface EvalRunSummary {
  evalRunId: string;
  totalCases: number;
  passed: number;
  failed: number;
  partial: number;
  skipped: number;
  passRate: number;
  durationMs: number;
  results: EvalCaseResult[];
}
