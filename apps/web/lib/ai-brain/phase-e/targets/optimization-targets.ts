/**
 * AI Brain Phase E — Versioned optimization targets.
 * Explicit target definitions with safe optimization boundaries.
 */

import type { OptimizationTargetLayer } from "../types";
import { OPTIMIZATION_TARGET_LAYERS } from "../types";

export interface OptimizationTargetDefinition {
  layer: OptimizationTargetLayer;
  description: string;
  versionBindingKey: string;
  /** Safe optimization boundaries (e.g. no removal of safety checks) */
  guardrails: string[];
}

export const OPTIMIZATION_TARGET_DEFINITIONS: OptimizationTargetDefinition[] = [
  {
    layer: "prompt",
    description: "Prompt set for orchestrator modes",
    versionBindingKey: "prompt",
    guardrails: ["no_secret_injection", "no_prompt_removal", "client_safe_preserved"],
  },
  {
    layer: "policy",
    description: "Action policy evaluator",
    versionBindingKey: "policy",
    guardrails: ["no_safety_relaxation", "approval_flow_preserved"],
  },
  {
    layer: "planner",
    description: "Action planner logic",
    versionBindingKey: "planner",
    guardrails: ["degradation_preserved", "role_fit_preserved"],
  },
  {
    layer: "tooling",
    description: "Tool registry config",
    versionBindingKey: "tool_registry",
    guardrails: ["no_arbitrary_tool_add", "auth_preserved"],
  },
  {
    layer: "output",
    description: "Output contract strictness",
    versionBindingKey: "output_contract",
    guardrails: ["schema_validation_preserved", "no_weakening"],
  },
  {
    layer: "memory_retrieval",
    description: "Memory retrieval config",
    versionBindingKey: "memory_retrieval",
    guardrails: ["tenant_scope_preserved", "expiry_preserved"],
  },
  {
    layer: "eval_config",
    description: "Eval suite config",
    versionBindingKey: "orchestrator",
    guardrails: ["no_case_removal", "grading_strategy_bounded"],
  },
];

export function getTargetDefinition(layer: OptimizationTargetLayer): OptimizationTargetDefinition | null {
  return OPTIMIZATION_TARGET_DEFINITIONS.find((t) => t.layer === layer) ?? null;
}

export function validateTargetLayer(layer: string): layer is OptimizationTargetLayer {
  return OPTIMIZATION_TARGET_LAYERS.includes(layer as OptimizationTargetLayer);
}
