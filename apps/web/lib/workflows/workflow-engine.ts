/**
 * Workflow engine: matches triggers to rules, evaluates conditions, dispatches actions.
 */

import type { WorkflowTrigger, WorkflowRule, WorkflowContext } from "./workflow.types";
import { evaluateAllConditions } from "./condition-evaluator";
import { dispatchActions } from "./action-dispatcher";
import type { WorkflowExecutionResult, WorkflowExecutionStep } from "./workflow-result";

export interface WorkflowEngineOptions {
  getRulesForTrigger?: (trigger: WorkflowTrigger) => Promise<WorkflowRule[]>;
}

export async function runWorkflow(
  trigger: WorkflowTrigger,
  rules: WorkflowRule[],
  buildContext: (t: WorkflowTrigger) => WorkflowContext
): Promise<{ matched: number; executed: number }> {
  const result = await runWorkflowWithResult(trigger, rules, buildContext);
  return { matched: result.matchedRules, executed: result.executedRules };
}

/** Runs workflow and returns full execution result for audit/tracing. */
export async function runWorkflowWithResult(
  trigger: WorkflowTrigger,
  rules: WorkflowRule[],
  buildContext: (t: WorkflowTrigger) => WorkflowContext
): Promise<WorkflowExecutionResult> {
  const ctx = buildContext(trigger);
  const steps: WorkflowExecutionStep[] = [];
  const relevant = rules.filter((r) => r.enabled && r.trigger === trigger.type);

  for (const rule of relevant) {
    const passes = evaluateAllConditions(rule.conditions, ctx);
    let executedCount = 0;
    let error: string | undefined;
    if (passes) {
      try {
        await dispatchActions(ctx, rule.actions);
        executedCount = rule.actions.length;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
    steps.push({
      ruleId: rule.id,
      trigger: rule.trigger,
      conditionsPassed: passes,
      actions: rule.actions,
      executedCount,
      error,
    });
  }

  const executedRules = steps.filter((s) => s.conditionsPassed && s.executedCount > 0).length;
  return {
    trigger,
    matchedRules: relevant.length,
    executedRules,
    steps,
    at: new Date().toISOString(),
  };
}

export function buildContextFromTrigger(trigger: WorkflowTrigger): WorkflowContext {
  const p = trigger.payload;
  return {
    trigger,
    projectId: (p.projectId as string) ?? "",
    tenantId: trigger.tenantId,
    severity: p.severity as string | undefined,
    overdueDays: p.overdueDays as number | undefined,
    riskScore: p.score as number | undefined,
    missingEvidenceCount: p.actual !== undefined ? (p.required as number) - (p.actual as number) : undefined,
    repeatedCount: undefined,
  };
}
