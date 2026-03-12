/**
 * Evaluates workflow conditions against context.
 */

import type { WorkflowCondition, WorkflowContext } from "./workflow.types";

export function evaluateCondition(condition: WorkflowCondition, ctx: WorkflowContext): boolean {
  switch (condition.kind) {
    case "severity_gte": {
      const order = { low: 0, medium: 1, high: 2 };
      const ctxLevel = ctx.severity ? order[ctx.severity as keyof typeof order] ?? 0 : 0;
      const threshold = condition.severity ? order[condition.severity as keyof typeof order] ?? 0 : 0;
      return ctxLevel >= threshold;
    }
    case "overdue_days_gt": {
      const n = condition.threshold ?? 0;
      return (ctx.overdueDays ?? 0) > n;
    }
    case "evidence_missing":
      return (ctx.missingEvidenceCount ?? 0) > 0;
    case "repeated_problem_count": {
      const c = condition.count ?? 1;
      return (ctx.repeatedCount ?? 0) >= c;
    }
    case "project_risk_score_gte": {
      const t = condition.threshold ?? 0;
      return (ctx.riskScore ?? 0) >= t;
    }
    default: {
      const _: never = condition.kind;
      return false;
    }
  }
}

export function evaluateAllConditions(conditions: WorkflowCondition[], ctx: WorkflowContext): boolean {
  return conditions.length === 0 || conditions.every((c) => evaluateCondition(c, ctx));
}
