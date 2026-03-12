/**
 * Workflow automation engine — triggers, conditions, actions.
 */

export type {
  TriggerType,
  ActionType,
  ConditionKind,
  WorkflowTrigger,
  WorkflowCondition,
  WorkflowAction,
  WorkflowRule,
  WorkflowContext,
} from "./workflow.types";
export { TRIGGER_PAYLOAD_KEYS, isTriggerType, validateTriggerPayload } from "./trigger-registry";
export { evaluateCondition, evaluateAllConditions } from "./condition-evaluator";
export {
  registerActionHandler,
  getActionHandler,
  dispatchAction,
  dispatchActions,
  type ActionHandler,
} from "./action-dispatcher";
export type { WorkflowExecutionResult, WorkflowExecutionStep } from "./workflow-result";
export { createEmptyResult } from "./workflow-result";
export {
  DEFAULT_WORKFLOW_RULES,
  getDefaultRulesForTrigger,
  getDefaultRulesByTriggerType,
} from "./workflow-definitions";
export {
  runWorkflow,
  runWorkflowWithResult,
  buildContextFromTrigger,
  type WorkflowEngineOptions,
} from "./workflow-engine";
