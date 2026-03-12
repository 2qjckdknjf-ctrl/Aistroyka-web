/**
 * Typed result of workflow execution for audit and callers.
 */

import type { WorkflowTrigger, WorkflowRule, WorkflowAction } from "./workflow.types";

export interface WorkflowExecutionStep {
  ruleId: string;
  trigger: WorkflowTrigger["type"];
  conditionsPassed: boolean;
  actions: WorkflowAction[];
  executedCount: number;
  error?: string;
}

export interface WorkflowExecutionResult {
  trigger: WorkflowTrigger;
  matchedRules: number;
  executedRules: number;
  steps: WorkflowExecutionStep[];
  at: string;
}

export function createEmptyResult(trigger: WorkflowTrigger): WorkflowExecutionResult {
  return {
    trigger,
    matchedRules: 0,
    executedRules: 0,
    steps: [],
    at: new Date().toISOString(),
  };
}
