/**
 * AI Brain Phase B — Policy input/output types.
 */

import type { AiActionType } from "../actions";
import type { ProjectTruthSnapshot } from "@/lib/ai-brain/phase-a";

export type RunContextRole = "manager" | "worker" | "client" | "admin";

export interface ActionPolicyInput {
  actionType: AiActionType;
  userRole: RunContextRole;
  tenantId: string;
  projectId: string;
  mode: string;
  snapshot: ProjectTruthSnapshot | null;
}

export interface ActionPolicyResult {
  policy: import("../actions").AiActionExecutionPolicy;
  riskLevel: import("../actions").AiActionRiskLevel;
  requiresApproval: boolean;
  unavailableReason?: string;
}
