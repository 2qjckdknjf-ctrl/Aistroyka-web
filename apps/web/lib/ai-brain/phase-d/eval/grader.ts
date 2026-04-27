/**
 * AI Brain Phase D — Minimal grader.
 * Evaluates output against expected assertions.
 */

import type { AiEvalCase, ExpectedAssertion } from "./eval-case.types";
import type { GraderOutput } from "./eval-runner.types";

function getAtPath(obj: unknown, path: string): unknown {
  if (!path || typeof obj !== "object" || obj == null) return undefined;
  const parts = path.replace(/\[\]/g, ".items").split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function checkAssertion(assertion: ExpectedAssertion, output: unknown): { ok: boolean; score?: number; warn?: string } {
  const val = assertion.path ? getAtPath(output, assertion.path) : output;

  switch (assertion.type) {
    case "schema":
      if (val === undefined || val === null) return { ok: false, warn: `Missing path: ${assertion.path}` };
      return { ok: true, score: typeof val === "object" ? 1 : 0.5 };
    case "contains":
      if (val === undefined || val === null) return { ok: false, warn: `Missing path: ${assertion.path}` };
      return { ok: true };
    case "score":
      if (typeof val !== "number" && typeof val !== "undefined") return { ok: false, warn: "Score not numeric" };
      const s = typeof val === "number" ? val : 0;
      const min = assertion.minScore ?? 0;
      return { ok: s >= min, score: s };
    case "refusal":
      const hasRefusal = typeof output === "object" && output !== null && "withheld" in (output as object);
      const expectRefusal = assertion.value === true;
      return { ok: hasRefusal === expectRefusal };
    case "degradation":
      const hasDegradation = typeof output === "object" && output !== null && "degradationFlags" in (output as object);
      const expectDegradation = assertion.value === true;
      return { ok: hasDegradation === expectDegradation };
    default:
      return { ok: false, warn: `Unknown assertion type: ${(assertion as ExpectedAssertion).type}` };
  }
}

export function gradeOutput(caseDef: AiEvalCase, output: unknown): GraderOutput {
  const warnings: string[] = [];
  const scores: Record<string, number> = {};
  let passed = 0;
  let failed = 0;

  if (!caseDef.expectedAssertions?.length) {
    return { result: "partial", scores: {}, warnings: ["No assertions defined"] };
  }

  for (let i = 0; i < caseDef.expectedAssertions.length; i++) {
    const a = caseDef.expectedAssertions[i] as ExpectedAssertion;
    const r = checkAssertion(a, output);
    if (r.warn) warnings.push(r.warn);
    if (r.score != null) scores[`assertion_${i}`] = r.score;
    if (r.ok) passed++;
    else failed++;
  }

  const total = passed + failed;
  const ratio = total > 0 ? passed / total : 0;

  let result: GraderOutput["result"];
  if (failed === 0) result = "pass";
  else if (passed === 0) result = "fail";
  else result = "partial";

  if (caseDef.gradingStrategy === "strict" && failed > 0) {
    result = "fail";
  } else if (caseDef.gradingStrategy === "lenient" && passed > 0) {
    result = ratio >= 0.5 ? "partial" : "fail";
    if (ratio >= 0.8) result = "pass";
  }

  return { result, scores, warnings };
}
