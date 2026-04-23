/**
 * AI Brain Phase D — Eval case types.
 */

export const EVAL_RESULTS = ["pass", "fail", "partial"] as const;
export type EvalResult = (typeof EVAL_RESULTS)[number];

export const GRADING_STRATEGIES = ["strict", "lenient", "weighted"] as const;
export type GradingStrategy = (typeof GRADING_STRATEGIES)[number];

export interface ExpectedAssertion {
  type: "contains" | "schema" | "score" | "refusal" | "degradation";
  path?: string;
  value?: unknown;
  minScore?: number;
}

export interface AiEvalCase {
  id: string;
  title: string;
  scenarioType: string;
  mode: string;
  requiredInputs: Record<string, unknown>;
  expectedAssertions: ExpectedAssertion[];
  gradingStrategy: GradingStrategy;
  tags: string[];
  active: boolean;
  createdAt: string;
}

export interface EvalCaseInput {
  title: string;
  scenarioType: string;
  mode: string;
  requiredInputs?: Record<string, unknown>;
  expectedAssertions?: ExpectedAssertion[];
  gradingStrategy?: GradingStrategy;
  tags?: string[];
  active?: boolean;
}
