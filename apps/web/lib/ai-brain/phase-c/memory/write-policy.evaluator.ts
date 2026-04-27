/**
 * AI Brain Phase C — Write policy evaluator.
 * Controls who/what may create memory and with what confidence.
 */

import type { AiMemoryType, AiMemorySourceKind, AiMemoryConfidence } from "./memory.types";

export interface WritePolicyInput {
  memoryType: AiMemoryType;
  sourceKind: AiMemorySourceKind;
  hasGroundingRefs: boolean;
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
}

export type WritePolicyResult =
  | { allowed: true; confidence: AiMemoryConfidence }
  | { allowed: false; reason: string };

export function evaluateWritePolicy(input: WritePolicyInput): WritePolicyResult {
  const { memoryType, sourceKind, hasGroundingRefs } = input;

  if (!input.tenantId?.trim()) {
    return { allowed: false, reason: "tenant_id required" };
  }

  switch (sourceKind) {
    case "human_confirmed":
      return { allowed: true, confidence: "high" };

    case "system_derived":
      if (memoryType === "session" || memoryType === "project_working") {
        return { allowed: true, confidence: hasGroundingRefs ? "high" : "medium" };
      }
      return { allowed: false, reason: `system_derived not allowed for ${memoryType}` };

    case "ai_suggested":
      if (memoryType === "session") return { allowed: true, confidence: "medium" };
      if (memoryType === "project_working" && hasGroundingRefs) {
        return { allowed: true, confidence: "medium" };
      }
      return { allowed: false, reason: "ai_suggested requires grounding for project_working" };

    case "ai_inferred":
      if (memoryType === "session") return { allowed: true, confidence: "low" };
      return { allowed: false, reason: "ai_inferred allowed only for session" };

    case "action_outcome":
      if (memoryType === "learning_candidate") return { allowed: true, confidence: "medium" };
      return { allowed: false, reason: "action_outcome only for learning_candidate" };

    default:
      return { allowed: false, reason: "unknown source kind" };
  }
}
